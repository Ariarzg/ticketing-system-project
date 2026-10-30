// Attachment rules (D28), shared by the browser (early feedback) and the API (the real check).
// Nothing here may use Bun or the database: client components import this file.

/** What the API returns for one attached file. */
export type AttachmentDto = {
	id: string;
	name: string;
	type: string;
	size: number;
};

/**
 * The allowed extensions, and the type each file is stored and served with. The type the browser
 * claims is never used. A Map, not an object: a name like "x.constructor" must not find anything.
 */
const FILE_TYPES = new Map([
	['png', 'image/png'],
	['jpg', 'image/jpeg'],
	['jpeg', 'image/jpeg'],
	['webp', 'image/webp'],
	['gif', 'image/gif'],
	['pdf', 'application/pdf'],
	['txt', 'text/plain'],
	[
		'docx',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	],
	[
		'xlsx',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	],
	['zip', 'application/zip'],
]);

export const MAX_FILES = 3;
/** All files of one message together. Vercel refuses request bodies over 4.5 MB, and the text must fit too. */
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

/** For the file input's `accept`: the picker then offers only these. */
export const ACCEPT = [...FILE_TYPES.keys()].map((ext) => `.${ext}`).join(',');

/** The type for a file name, or undefined when its extension is not allowed. */
export function fileType(name: string): string | undefined {
	const dot = name.lastIndexOf('.');
	return dot > 0 ?
			FILE_TYPES.get(name.slice(dot + 1).toLowerCase())
		:	undefined;
}

export function isImage(type: string): boolean {
	return type.startsWith('image/');
}

/** What is wrong with a set of files, or null. The codes are the API's error codes; their texts are in `t.errors`. */
export function fileProblem(files: { name: string; size: number }[]) {
	if (files.length > MAX_FILES) return 'too_many_files' as const;
	if (files.some((f) => !fileType(f.name))) return 'file_type' as const;
	if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES)
		return 'files_too_large' as const;
	return null;
}

/** "۳۴۰ کیلوبایت", "۱٫۲ مگابایت". */
export function formatSize(bytes: number): string {
	const mb = bytes / (1024 * 1024);
	return mb >= 1 ?
			`${mb.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت`
		:	`${Math.max(1, Math.round(bytes / 1024)).toLocaleString('fa-IR')} کیلوبایت`;
}

/** The multipart body the API reads: the text fields, plus every file under the name "files". */
export function toForm(
	fields: Record<string, string>,
	files: File[],
): FormData {
	const form = new FormData();
	for (const [name, value] of Object.entries(fields)) form.append(name, value);
	for (const file of files) form.append('files', file);
	return form;
}
