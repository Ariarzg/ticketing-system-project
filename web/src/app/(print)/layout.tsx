// The print pages of the exports (D30): a white A4 sheet whatever the theme, so text prints dark on paper.
// No sidebar: the page is opened in its own tab, printed, and saved as PDF.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<style>{'@page { size: A4; margin: 14mm; }'}</style>
			<div className="min-h-dvh bg-neutral-200 px-3 py-6 print:bg-white print:p-0">
				<main className="mx-auto max-w-[210mm] rounded-lg bg-white p-5 text-neutral-900 shadow-lg sm:p-[14mm] print:max-w-none print:rounded-none print:p-0 print:shadow-none">
					{children}
				</main>
			</div>
		</>
	);
}
