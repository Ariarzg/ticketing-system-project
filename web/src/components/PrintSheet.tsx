'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@heroui/react';
import { PrinterIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/dates';
import type { ExportSection } from '@/lib/reports';
import { t } from '@/lib/strings.fa';

/**
 * A printable report (D30). Once `ready` and every picture has loaded, it opens the browser's print dialog,
 * where "Save as PDF" makes the file. The browser draws the Persian text, so letters join and stay
 * selectable. The document title becomes the PDF's suggested file name.
 */
export function PrintSheet({
	kind,
	title,
	ready,
	failed,
	children,
}: {
	/** What this is, like "گزارش کاربر". */
	kind: string;
	title?: string;
	ready: boolean;
	failed: boolean;
	children?: React.ReactNode;
}) {
	const sheet = useRef<HTMLDivElement>(null);
	// Strict Mode runs effects twice in dev; the dialog must open once.
	const printed = useRef(false);

	useEffect(() => {
		if (title) document.title = `${kind} - ${title}`;
	}, [kind, title]);

	useEffect(() => {
		if (!ready || printed.current) return;
		printed.current = true;
		const images = [...(sheet.current?.querySelectorAll('img') ?? [])];
		void Promise.all(
			images.map((img) =>
				img.complete ? null : (
					new Promise((done) => {
						img.addEventListener('load', done);
						img.addEventListener('error', done);
					})
				),
			),
		).then(() => window.print());
	}, [ready]);

	return (
		<div ref={sheet}>
			<div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 print:hidden">
				<p className="text-sm text-neutral-600">{t.exports.printHint}</p>
				<Button
					variant="primary"
					isDisabled={!ready}
					onPress={() => window.print()}
				>
					<PrinterIcon size={18} />
					{t.exports.print}
				</Button>
			</div>
			{failed ?
				<p>{t.exports.failed}</p>
			: !ready ?
				<p className="text-neutral-600">{t.exports.loading}</p>
			:	<>
					<header className="mb-6 border-b-2 border-neutral-900 pb-3">
						<p className="text-xs text-neutral-500">
							{t.appName} · {kind}
						</p>
						<h1
							dir="auto"
							className="mt-1 text-right text-2xl font-bold break-words"
						>
							{title}
						</h1>
						<p className="mt-1 text-xs text-neutral-500">
							{t.exports.madeAt} {formatDate(new Date())}
						</p>
					</header>
					{children}
				</>
			}
		</div>
	);
}

const show = (value: string | number) =>
	typeof value === 'number' ? value.toLocaleString('fa-IR') : value;

/** The blocks of a report as tables. The CSV of the same report holds the same rows. */
export function ReportSections({ sections }: { sections: ExportSection[] }) {
	return (
		<div className="flex flex-col gap-8">
			{sections.map((s) => (
				<section key={s.title}>
					<h2 className="mb-2 text-base font-bold">{s.title}</h2>
					{'pairs' in s ?
						<table className="w-full text-sm">
							<tbody>
								{s.pairs.map(([label, value]) => (
									<tr
										key={label}
										className="border-b border-neutral-200"
									>
										<th
											scope="row"
											className="w-48 py-1.5 text-right font-normal text-neutral-600"
										>
											{label}
										</th>
										{/* Own direction plus text-right: an email or English name keeps its order on the page's side. */}
										<td
											dir="auto"
											className="py-1.5 text-right break-all"
										>
											{show(value)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					: s.rows.length === 0 ?
						<p className="text-sm text-neutral-600">{t.exports.none}</p>
					:	<div className="overflow-x-auto print:overflow-visible">
							<table className="w-full border-collapse text-xs">
								<thead>
									<tr className="border-b-2 border-neutral-900">
										{s.head.map((h) => (
											<th
												key={h}
												className="px-1.5 py-1.5 text-right font-bold"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{s.rows.map((row, i) => (
										<tr
											key={i}
											className="break-inside-avoid border-b border-neutral-200"
										>
											{row.map((cell, j) => (
												<td
													key={j}
													dir="auto"
													className="px-1.5 py-1.5 text-right align-top"
												>
													{show(cell)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					}
				</section>
			))}
		</div>
	);
}
