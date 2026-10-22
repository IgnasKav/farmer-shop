import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile, Workbook } from '@oai/artifact-tool';
const dir = new URL('./', import.meta.url);
const source = new URL('legacy-shops-over-impression-limit.xlsx', dir).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const rows = wb.worksheets.getItem('Shops').getUsedRange().values;
if (rows.length !== 40 || rows[0][0] !== 'Shop name' || rows[0][1] !== 'Email') throw new Error('Unexpected worksheet structure');
const escape = value => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};
const csv = rows.map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
const target = new URL('legacy-shops-over-impression-limit.csv', dir);
await fs.writeFile(target, csv, 'utf8');
const check = await Workbook.fromCSV(await fs.readFile(target, 'utf8'), { sheetName: 'Check' });
const actual = check.worksheets.getItem('Check').getUsedRange().values;
if (JSON.stringify(actual) !== JSON.stringify(rows)) throw new Error('CSV round-trip mismatch');
console.log('CSV verified: 39 shops, 2 columns, all emails present: ' + rows.slice(1).every(row => !!row[1]));
