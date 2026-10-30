import { buttonVariants } from '@heroui/react';
import { FileCsvIcon, FilePdfIcon } from '@phosphor-icons/react';
import { t } from '@/lib/strings.fa';

/** A page's report links (D30): the PDF opens a print page in a new tab, the CSV downloads at once. */
export function ExportButtons({ pdf, csv }: { pdf: string; csv?: string }) {
	const style = buttonVariants({ size: 'sm', variant: 'secondary' });
	return (
		<div className="flex flex-wrap items-center gap-2">
			<a
				href={pdf}
				target="_blank"
				rel="noopener"
				className={style}
			>
				<FilePdfIcon size={16} />
				{t.exports.pdf}
			</a>
			{csv && (
				<a
					href={csv}
					download
					className={style}
				>
					<FileCsvIcon size={16} />
					{t.exports.csv}
				</a>
			)}
		</div>
	);
}
