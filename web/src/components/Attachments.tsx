'use client';

import { Modal, buttonVariants } from '@heroui/react';
import {
	DownloadSimpleIcon,
	FileDocIcon,
	FileIcon,
	FilePdfIcon,
	FileTxtIcon,
	FileXlsIcon,
	FileZipIcon,
	type Icon,
} from '@phosphor-icons/react';
import { formatSize, isImage, type AttachmentDto } from '@/lib/files';
import { t } from '@/lib/strings.fa';

const ICONS: Record<string, Icon> = {
	'application/pdf': FilePdfIcon,
	'text/plain': FileTxtIcon,
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
		FileDocIcon,
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
		FileXlsIcon,
	'application/zip': FileZipIcon,
};

/** Every file opens through our route, which checks access and sends the file itself (D28). */
const href = (file: AttachmentDto) => `/api/attachments/${file.id}`;

/**
 * The files of one message. Images are thumbnails that open large in a dialog over the page; other files
 * are rows that download under their original name.
 */
export function Attachments({
	files,
	ourSide,
}: {
	files: AttachmentDto[];
	ourSide: boolean;
}) {
	if (files.length === 0) return null;
	const images = files.filter((f) => isImage(f.type));
	const others = files.filter((f) => !isImage(f.type));
	return (
		<div
			className={`flex max-w-full flex-col gap-2 ${ourSide ? 'items-end' : 'items-start'}`}
		>
			{images.length > 0 && (
				<div
					className={`flex flex-wrap gap-2 ${ourSide ? 'justify-end' : ''}`}
				>
					{images.map((f) => (
						<ImageAttachment
							key={f.id}
							file={f}
						/>
					))}
				</div>
			)}
			{others.map((f) => {
				const FileTypeIcon = ICONS[f.type] ?? FileIcon;
				return (
					<a
						key={f.id}
						href={href(f)}
						className="flex max-w-full items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface-secondary"
					>
						<FileTypeIcon
							size={20}
							className="shrink-0 text-muted"
						/>
						<span
							dir="auto"
							className="truncate"
						>
							{f.name}
						</span>
						<span className="shrink-0 text-xs text-muted">
							{formatSize(f.size)}
						</span>
					</a>
				);
			})}
		</div>
	);
}

/** One picture: a thumbnail that opens it large in a dialog, with its name and a download button. */
function ImageAttachment({ file }: { file: AttachmentDto }) {
	return (
		<Modal>
			{/* A div with role="button": React Aria's Pressable needs tabIndex to reach it with the keyboard. */}
			<Modal.Trigger
				tabIndex={0}
				className="cursor-zoom-in overflow-hidden rounded-2xl border border-border"
			>
				{/* A plain img: next/image cannot fetch a file that sits behind our login. */}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={href(file)}
					alt={file.name}
					loading="lazy"
					className="block h-32 max-w-56 object-cover"
				/>
			</Modal.Trigger>
			<Modal.Backdrop>
				<Modal.Container size="lg">
					<Modal.Dialog>
						<Modal.CloseTrigger aria-label={t.files.close} />
						<Modal.Header>
							{/* The heading stays right-to-left, clear of the close button; only the name follows its own language. */}
							<Modal.Heading className="truncate pe-8">
								<bdi>{file.name}</bdi>
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							{/* The same URL as the thumbnail, so the browser already has it in its cache. */}
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={href(file)}
								alt={file.name}
								className="mx-auto max-h-[70vh] max-w-full rounded-xl object-contain"
							/>
						</Modal.Body>
						<Modal.Footer>
							<a
								href={href(file)}
								download={file.name}
								className={buttonVariants({ variant: 'secondary' })}
							>
								<DownloadSimpleIcon size={18} />
								{t.files.download}
								<span className="text-xs text-muted">
									{formatSize(file.size)}
								</span>
							</a>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
