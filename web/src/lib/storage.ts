// Neon Object Storage for attachments (D28). Server only: it uses Bun's built-in S3 client.
// Browsers never talk to the bucket: *.neon.tech cannot be reached from Iran, so every byte goes through our API.
import type { db } from '@/db';
import { attachments } from '@/db/schema';
import { fileProblem, fileType, isImage, type AttachmentDto } from './files';
import { HttpError } from './http';

/** The bucket has this name on every branch; the keys in .env.local decide which branch it is. */
const BUCKET = 'attachments';

function env(name: string): string {
	const value = process.env[name];
	// Bun crashes the whole server when it signs a request without keys, so stop with a clear error first.
	if (!value)
		throw new Error(
			`${name} is not set: add the storage keys to .env.local (GUIDEv4, v1.5 Step 1)`,
		);
	return value;
}

let client: Bun.S3Client | undefined;

/** Made on first use, not when the file loads, so `next build` works on a machine without the keys. */
function bucket(): Bun.S3Client {
	// Neon needs path-style addresses (endpoint/bucket/key), which is Bun's default.
	client ??= new Bun.S3Client({
		endpoint: env('AWS_ENDPOINT_URL_S3'),
		accessKeyId: env('AWS_ACCESS_KEY_ID'),
		secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
		region: env('AWS_REGION'),
		bucket: BUCKET,
	});
	return client;
}

/** A file's place in the bucket. Built from ids only, so a user's file name never reaches a storage path. */
function objectKey(file: { ticketId: string; id: string }): string {
	return `tickets/${file.ticketId}/${file.id}`;
}

/**
 * Reads a body that is either JSON or multipart form data (the browser sends files that way):
 * the text fields, and the files under "files". Files that break the rules are refused here with 400.
 * JSON still works, so callers without files (and the earlier test scripts) need no change.
 */
export async function readBody(
	req: Request,
): Promise<{ fields: unknown; files: File[] }> {
	if (!req.headers.get('content-type')?.startsWith('multipart/form-data')) {
		return { fields: await req.json(), files: [] };
	}
	const form = await req.formData().catch(() => {
		throw new HttpError(400, 'invalid_input');
	});
	const fields: Record<string, string> = {};
	const files: File[] = [];
	for (const [name, value] of form) {
		if (typeof value === 'string') fields[name] = value;
		else if (name === 'files' && value.size > 0) files.push(value);
	}
	const problem = fileProblem(files);
	if (problem) throw new HttpError(400, problem);
	return { fields, files };
}

/** The transaction `db.transaction` hands to its callback. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Uploads the files and records them, inside the caller's transaction. If an upload or the insert fails,
 * the files already uploaded are deleted and the error goes on, so the transaction rolls back and no row
 * points at a missing file.
 */
export async function saveFiles(
	tx: Tx,
	files: File[],
	owner: { ticketId: string; messageId?: string },
): Promise<AttachmentDto[]> {
	const rows = files.map((file) => ({
		id: crypto.randomUUID(),
		...owner,
		name: file.name,
		type: fileType(file.name)!, // readBody refused every other type
		size: file.size,
	}));
	const uploaded: typeof rows = [];
	try {
		for (const [i, row] of rows.entries()) {
			await bucket().write(objectKey(row), files[i], { type: row.type });
			uploaded.push(row);
		}
		if (rows.length > 0) await tx.insert(attachments).values(rows);
	} catch (e) {
		await Promise.allSettled(
			uploaded.map((row) => bucket().delete(objectKey(row))),
		);
		throw e;
	}
	// shortcut: if the commit itself fails after this returns, the uploaded files stay in the bucket with no row;
	// add a cleanup job that deletes keys without a row if that is ever seen.
	return rows.map(({ id, name, type, size }) => ({ id, name, type, size }));
}

/**
 * The file as a response from our own domain. Images open in the browser, everything else downloads;
 * `filename*` carries a Persian name intact. Read whole (at most 4 MB) rather than streamed, so a storage
 * error becomes a 500 instead of a cut-off file the browser would keep in its cache.
 */
export async function fileResponse(file: {
	ticketId: string;
	id: string;
	name: string;
	type: string;
}): Promise<Response> {
	const body = await bucket().file(objectKey(file)).arrayBuffer();
	const disposition = isImage(file.type) ? 'inline' : 'attachment';
	return new Response(body, {
		headers: {
			'Content-Type': file.type,
			'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
			// A file never changes after upload. Private: it sits behind a login, so no shared cache may keep it.
			'Cache-Control': 'private, max-age=86400',
			// The file comes from our own domain now, so the browser must never guess a type (like HTML) from its bytes.
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
