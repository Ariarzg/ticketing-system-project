'use client';

import { useRef } from 'react';
import { Button, toast } from '@heroui/react';
import { PaperclipIcon, XIcon } from '@phosphor-icons/react';
import { ACCEPT, fileProblem, formatSize } from '@/lib/files';
import { t } from '@/lib/strings.fa';

type Props = { files: File[]; onChange: (files: File[]) => void };

/** The paperclip button. Adds the chosen files to the list, or says what is wrong and keeps the list as it was. */
export function AttachButton({
	files,
	onChange,
	isDisabled = false,
}: Props & { isDisabled?: boolean }) {
	const input = useRef<HTMLInputElement>(null);
	return (
		<>
			<input
				ref={input}
				type="file"
				multiple
				accept={ACCEPT}
				hidden
				onChange={(e) => {
					const next = [...files, ...Array.from(e.target.files ?? [])];
					e.target.value = ''; // so that choosing the same file again fires onChange again
					const problem = fileProblem(next);
					if (problem) toast.danger(t.errors[problem]);
					else onChange(next);
				}}
			/>
			<Button
				isIconOnly
				variant="ghost"
				aria-label={t.files.attach}
				isDisabled={isDisabled}
				onPress={() => input.current?.click()}
			>
				<PaperclipIcon size={20} />
			</Button>
		</>
	);
}

/** The files chosen so far, each with a button that takes it off the list. */
export function PickedFiles({ files, onChange }: Props) {
	if (files.length === 0) return null;
	return (
		<ul
			aria-label={t.files.picked}
			className="flex flex-wrap gap-2"
		>
			{files.map((file, i) => (
				<li
					key={`${file.name}-${i}`}
					className="flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface ps-3 pe-1 text-sm"
				>
					<span
						dir="auto"
						className="truncate"
					>
						{file.name}
					</span>
					<span className="shrink-0 text-xs text-muted">
						{formatSize(file.size)}
					</span>
					<Button
						isIconOnly
						size="sm"
						variant="ghost"
						aria-label={`${t.files.remove} ${file.name}`}
						onPress={() => onChange(files.filter((_, j) => j !== i))}
					>
						<XIcon size={14} />
					</Button>
				</li>
			))}
		</ul>
	);
}
