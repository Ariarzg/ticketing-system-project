// Checks the CSV writer of the exports (D30): quoting, formula guard, and the file layout. Run: bun scripts/check-csv.ts
import { csvCell, toCsv } from '../src/lib/csv';

const cells: [string | number, string][] = [
	['plain', 'plain'],
	['سلام دنیا', 'سلام دنیا'],
	['a,b', '"a,b"'],
	['say "hi"', '"say ""hi"""'],
	['two\nlines', '"two\nlines"'],
	['=1+1', "'=1+1"],
	['@SUM(A1)', "'@SUM(A1)"],
	['+98', "'+98"],
	['-2', "'-2"],
	['=a,b', `"'=a,b"`],
	[42, '42'],
	[-3, '-3'],
];

let failed = 0;
for (const [input, want] of cells) {
	const got = csvCell(input);
	if (got !== want) {
		failed++;
		console.log(`FAIL ${JSON.stringify(input)}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
	}
}

const file = toCsv([
	{ title: 'Details', pairs: [['Name', 'Ali'], ['Tickets', 2]] },
	{ title: 'Tickets', head: ['Ref', 'Title'], rows: [['#1', 'a, b']] },
]);
const wantFile = '﻿Details\r\nName,Ali\r\nTickets,2\r\n\r\nTickets\r\nRef,Title\r\n#1,"a, b"\r\n';
if (file !== wantFile) {
	failed++;
	console.log(`FAIL toCsv: got ${JSON.stringify(file)}`);
}

if (failed > 0) {
	console.log(`${failed} failed.`);
	process.exit(1);
}
console.log(`All ${cells.length + 1} cases passed.`);
