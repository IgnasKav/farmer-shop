import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile, FileBlob } from '@oai/artifact-tool';
const dir = new URL('./', import.meta.url);
const csv = await fs.readFile('C:/Users/Ignas/Downloads/shopify-essential-estimated-shops-2026-09-25/estimated-user-emails-2026-09-25.csv', 'utf8');
const input = await Workbook.fromCSV(csv, { sheetName: 'Source' });
const rows = input.worksheets.getItem('Source').getUsedRange().values;
const filePath = new URL('legacy-shops-over-impression-limit.xlsx',dir).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(filePath));
const sheet = wb.worksheets.getItem('Shops');
const values = sheet.getUsedRange().values;
if (values.length !== 40 || values[0][0] !== 'Shop name' || new Set(values.slice(1).map(r=>r[0])).size !== 39) throw new Error('Export validation failed');
const domainCol = rows[0].indexOf('Shop domain');
const emailCol = rows[0].indexOf('Shop email');
if (domainCol < 0 || emailCol < 0) throw new Error('Missing source columns');
const normalize = value => String(value ?? '').trim().toLowerCase();
const emailsByDomain = new Map();
for (const row of rows.slice(1)) {
  const domain = normalize(row[domainCol]);
  const email = String(row[emailCol] ?? '').trim();
  if (!domain || !email) continue;
  if (!emailsByDomain.has(domain)) emailsByDomain.set(domain, new Map());
  emailsByDomain.get(domain).set(normalize(email), email);
}
const changes = [], conflicts = [];
for (let i = 1; i < values.length; i++) {
  if (normalize(values[i][1])) continue;
  const matches = emailsByDomain.get(normalize(values[i][0]));
  if (matches?.size > 1) { conflicts.push(values[i][0]); continue; }
  if (matches?.size === 1) {
    const email = [...matches.values()][0];
    sheet.getRange(`B${i+1}`).values = [[email]];
    changes.push({shop:values[i][0], email});
  }
}
wb.recalculate();
const after = sheet.getRange('A1:B40').values;
if (after.some((r,i)=>r[0]!==values[i][0] || (normalize(values[i][1]) && r[1]!==values[i][1]))) throw new Error('Existing data changed');
console.log(JSON.stringify({shops:39,backfilled:changes.length,missingEmails:after.slice(1).filter(r=>!normalize(r[1])).length,conflicts}));
await fs.writeFile(new URL('backfill-audit.json', dir), JSON.stringify({source:'estimated-user-emails-2026-09-25.csv',changes,conflicts},null,2));
const preview = await wb.render({sheetName:'Shops', range:'A1:B12',scale:1,format:'png'});
await fs.writeFile(new URL('preview.png',dir),new Uint8Array(await preview.arrayBuffer()));
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(new URL('legacy-shops-over-impression-limit.xlsx',dir).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
console.log('Verified 39 unique shops; Excel export saved.');
