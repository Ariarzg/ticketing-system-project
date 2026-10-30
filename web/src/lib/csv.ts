// CSV for the exports (D30): RFC 4180 quoting, CRLF lines, and a UTF-8 mark so Excel shows Persian.
import type { ExportSection } from './reports';

/** Excel and others run a cell that starts with one of these as a formula, so such text gets a leading apostrophe. */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number): string {
	if (typeof value === 'number') return String(value);
	const text = FORMULA_START.test(value) ? `'${value}` : value;
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Every section in one file: its title on a row of its own, then its rows; a blank row between sections. */
export function toCsv(sections: ExportSection[]): string {
	const lines: string[] = [];
	for (const s of sections) {
		if (lines.length > 0) lines.push('');
		lines.push(csvCell(s.title));
		const rows = 'pairs' in s ? s.pairs : [s.head, ...s.rows];
		for (const row of rows) lines.push(row.map(csvCell).join(','));
	}
	return `﻿${lines.join('\r\n')}\r\n`;
}
