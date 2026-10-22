import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir = new URL('./', import.meta.url);
const raw = await fs.readFile(new URL('data.md', dir), 'utf8');
const rows = raw.trim().split(/\r?\n/).filter(Boolean).map((line,i) => {
  const t = [...line.matchAll(/"([^"]*)"|(\S+)/g)].map(m=>m[1]??m[2]);
  assert.match(t[1], /\.myshopify\.com$/);
  assert.ok(['founder','essential','professional','starter'].includes(t[4]), `Unknown plan on row ${i+1}`);
  assert.ok(['MONTHLY','YEARLY'].includes(t[10]));
  return {shop:t[1], audience:t[2], plan:t[4], gifted:t[5]==='true', enabled:t[6]==='true', interval:t[10], issue:t.includes('Subscription verification failed. Retry or contact support.')};
});
assert.equal(new Set(rows.map(r=>r.shop)).size, rows.length);
assert.ok(rows.every(r=>!r.gifted && r.enabled));
const plans = ['essential','professional','starter','founder'];
const colors = ['#4f46e5','#16a394','#f4ac45','#e66c87'];
const counts = plans.map(plan=>rows.filter(r=>r.plan===plan).length);
const total = rows.length;
const pct = n => (n/total*100).toFixed(1)+'%';
const title = s => s[0].toUpperCase()+s.slice(1).toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let angle = -Math.PI/2;
const slices = counts.map((count,i)=>{
  const end = angle+count/total*Math.PI*2;
  const x = a => 160+140*Math.cos(a), y=a=>160+140*Math.sin(a);
  const d = `M160,160 L${x(angle)},${y(angle)} A140,140 0 ${end-angle>Math.PI?1:0},1 ${x(end)},${y(end)} Z`;
  angle=end;
  return `<path d="${d}" fill="${colors[i]}" stroke="white" stroke-width="3"><title>${title(plans[i])}: ${count} shops (${pct(count)})</title></path>`;
}).join('');
const legacy=rows.filter(r=>r.audience==='legacy').length;
const annual=rows.filter(r=>r.interval==='YEARLY').length;
// USD cents keep the supplied monthly-equivalent prices exact.
const prices = {
  legacy: {free:[0,0], founder:[899,719]},
  new: {free:[0,0], starter:[499,399], essential:[999,799], professional:[2499,1999]},
};
const usd = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
for (const row of rows) {
  assert.ok(prices[row.audience]?.[row.plan], 'Missing price configuration');
  row.mrr = prices[row.audience][row.plan][row.interval==='YEARLY'?1:0];
}
const sumMrr = list => list.reduce((sum,r)=>sum+r.mrr,0);
const mrr = sumMrr(rows);
const issueMrr = sumMrr(rows.filter(r=>r.issue));
const planRevenue = plans.map(plan=>{
  const shops = rows.filter(r=>r.plan===plan);
  return {plan,monthly:shops.filter(r=>r.interval==='MONTHLY'),yearly:shops.filter(r=>r.interval==='YEARLY'),mrr:sumMrr(shops)};
});
assert.equal(planRevenue.reduce((sum,p)=>sum+p.mrr,0),mrr);
assert.equal(mrr,28296);
assert.equal(sumMrr(rows.filter(r=>r.interval==='YEARLY')),1518);
const revenueSection = `<section class="panel table-panel"><h2>Monthly recurring revenue</h2><p>Configured subscription value, normalized to one month in USD.</p><div class="metrics" style="margin-top:20px"><div class="card"><div class="label">Total MRR</div><div class="value">${usd(mrr)}</div><div class="small">Across all ${total} shops in this export</div></div><div class="card"><div class="label">Annualized run rate</div><div class="value">${usd(mrr*12)}</div><div class="small">Total MRR × 12</div></div><div class="card"><div class="label">Monthly billing MRR</div><div class="value">${usd(sumMrr(rows.filter(r=>r.interval==='MONTHLY')))}</div><div class="small">${total-annual} monthly subscriptions</div></div><div class="card"><div class="label">Yearly billing MRR</div><div class="value">${usd(sumMrr(rows.filter(r=>r.interval==='YEARLY')))}</div><div class="small">${annual} annual subscriptions, monthly equivalent</div></div></div><div class="scroll"><table><thead><tr><th>Plan</th><th>Monthly shops × rate</th><th>Yearly shops × monthly equivalent</th><th>MRR (USD)</th><th>MRR share</th></tr></thead><tbody>${planRevenue.map(p=>{const rate=prices[p.plan==='founder'?'legacy':'new'][p.plan];return `<tr><td>${title(p.plan)}</td><td>${p.monthly.length} × ${usd(rate[0])}</td><td>${p.yearly.length} × ${usd(rate[1])}</td><td><strong>${usd(p.mrr)}</strong></td><td>${(p.mrr/mrr*100).toFixed(1)}%</td></tr>`;}).join('')}</tbody><tfoot><tr><td><strong>Total</strong></td><td>${total-annual} shops</td><td>${annual} shops</td><td><strong>${usd(mrr)}</strong></td><td>100%</td></tr></tfoot></table></div><p class="small">MRR = monthly subscriptions × monthlyPriceUsd + yearly subscriptions × annualMonthlyPriceUsd. The annual rate is already a monthly equivalent and is not divided by 12 again. Rates use the supplied legacy or new audience configuration. This is configured recurring revenue, before fees, taxes, refunds or prorations; it is not a measure of collected payments.</p><div class="note">The shop with a subscription-verification error contributes ${usd(issueMrr)} to this total. Excluding that shop, MRR is ${usd(mrr-issueMrr)}.</div></section>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Purchased plans · Shop analysis</title>
<style>
:root{font-family:Inter,Segoe UI,Arial,sans-serif;color:#19233d;background:#f5f6fa;font-synthesis:none}*{box-sizing:border-box}body{margin:0}main{max-width:1160px;margin:auto;padding:48px 28px}header{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:30px}.eyebrow{font-size:12px;font-weight:700;letter-spacing:2px;color:#635bd2}h1{font-size:38px;letter-spacing:-1.5px;margin:10px 0}p{color:#68728a;line-height:1.6;margin:8px 0}.date{border:1px solid #dce1ec;border-radius:24px;padding:10px 16px;font-size:13px;white-space:nowrap}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.card,.panel{background:white;border:1px solid #e2e6ef;border-radius:18px}.card{padding:22px}.label{font-size:13px;color:#68728a}.value{font-size:34px;font-weight:700;margin:10px 0 4px;letter-spacing:-1px}.small{font-size:12px;color:#68728a}.grid{display:grid;grid-template-columns:1.35fr 1fr;gap:24px}.panel{padding:26px}h2{font-size:19px;margin:0 0 7px}h3{font-size:14px;margin:24px 0 12px}.chart{display:flex;align-items:center;gap:28px;margin-top:24px}.chart svg{width:55%;max-width:310px;height:auto}.legend{flex:1}.legend-row{display:grid;grid-template-columns:12px 1fr auto;gap:9px;align-items:center;padding:13px 0;border-bottom:1px solid #edf0f6;font-size:14px}.dot{width:10px;height:10px;border-radius:50%}.share{font-size:12px;color:#68728a;margin-top:3px}.bar{display:flex;height:12px;background:#eef0f7;border-radius:9px;overflow:hidden;margin:12px 0}.split{display:flex;justify-content:space-between;font-size:13px;gap:12px}.note{background:#f5f4ff;border-radius:10px;padding:14px;margin-top:24px;font-size:13px;line-height:1.6;color:#554b9b}.table-panel{margin-top:24px}.toolbar{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:20px}.controls{display:flex;gap:10px}input,select{font:inherit;font-size:13px;border:1px solid #d9dfeb;border-radius:9px;padding:11px;background:white;color:#19233d}input{width:230px}input:focus,select:focus{outline:2px solid #8b83ed;outline-offset:2px}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}th{font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#68728a;background:#f8f9fc;padding:13px 14px}td{padding:14px;border-bottom:1px solid #edf0f6}td:first-child{font-weight:500}.pill{padding:5px 9px;border-radius:6px;background:#f0efff;color:#554b9b;display:inline-block}.warning{color:#9c6416;font-size:11px;display:block;margin-top:5px}footer{font-size:12px;color:#737e92;margin-top:22px;line-height:1.8}a{color:inherit}#empty{padding:25px;text-align:center}button{font:inherit}.count{font-size:12px;color:#68728a;margin-top:16px}@media(max-width:850px){.grid{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}header{align-items:flex-start}.toolbar{align-items:flex-start;flex-direction:column}}@media(max-width:520px){main{padding:28px 16px}h1{font-size:30px}header{display:block}.date{display:inline-block;margin-top:12px}.card{padding:16px}.value{font-size:28px}.panel{padding:20px}.chart{gap:12px}.controls{width:100%;flex-direction:column}input,select{width:100%}.legend-row{font-size:12px}}
</style></head><body><main>
<header><div><div class="eyebrow">CUSTOMER ANALYTICS</div><h1>Purchased plans</h1><p>A snapshot of the shops in your current paid-plan export.</p></div><div class="date">21 October 2026</div></header>
<section class="metrics" aria-label="Key figures">
<div class="card"><div class="label">Shops in export</div><div class="value">${total}</div><div class="small">Unique Shopify domains</div></div>
<div class="card"><div class="label">Most popular plan</div><div class="value">Essential</div><div class="small">${counts[0]} shops · ${pct(counts[0])} of the cohort</div></div>
<div class="card"><div class="label">New audience</div><div class="value">${total-legacy}<span class="small"> / ${total}</span></div><div class="small">${legacy} legacy shops</div></div>
<div class="card"><div class="label">Annual billing</div><div class="value">${annual}<span class="small"> / ${total}</span></div><div class="small">${total-annual} shops billed monthly</div></div></section>
<div class="grid"><section class="panel"><h2>Billing plan distribution</h2><p class="small">Share of shops by billingPlan · ${total} shops</p><div class="chart"><svg viewBox="0 0 320 320" role="img" aria-label="Pie chart: ${plans.map((p,i)=>`${p} ${counts[i]} shops`).join(', ')}">${slices}</svg><div class="legend">${plans.map((p,i)=>`<div class="legend-row"><span class="dot" style="background:${colors[i]}"></span><div>${title(p)}<div class="share">${pct(counts[i])}</div></div><strong>${counts[i]}</strong></div>`).join('')}</div></div></section>
<section class="panel"><h2>Cohort breakdown</h2><p class="small">Audience and billing cadence across the full export</p><h3>Audience</h3><div class="split"><span>New · ${total-legacy}</span><span>Legacy · ${legacy}</span></div><div class="bar"><span style="width:${pct(total-legacy)};background:#4f46e5"></span><span style="flex:1;background:#e66c87"></span></div><h3>Billing interval</h3><div class="split"><span>Monthly · ${total-annual}</span><span>Yearly · ${annual}</span></div><div class="bar"><span style="width:${pct(total-annual)};background:#16a394"></span><span style="flex:1;background:#f4ac45"></span></div><div class="note">Essential accounts for ${pct(counts[0])} of shops. All ${legacy} legacy shops are on Founder. ${annual} shops use annual billing.</div></section></div>
<section class="panel table-panel"><div class="toolbar"><div><h2>Shop directory</h2><p class="small">Search or filter the ${total} shops. Charts show the full cohort.</p></div><div class="controls"><input id="search" type="search" placeholder="Search shop domain…" aria-label="Search shop domain"><select id="plan" aria-label="Filter billing plan"><option value="">All plans</option>${plans.map(p=>`<option value="${p}">${title(p)}</option>`).join('')}</select></div></div><div class="scroll"><table><thead><tr><th>Shop domain</th><th>Billing plan</th><th>Audience</th><th>Billing interval</th></tr></thead><tbody>${rows.map(r=>`<tr data-shop="${esc(r.shop)}" data-plan="${r.plan}"><td>${esc(r.shop)}${r.issue?'<span class="warning">Subscription verification failed in source export</span>':''}</td><td><span class="pill">${title(r.plan)}</span></td><td>${title(r.audience)}</td><td>${title(r.interval)}</td></tr>`).join('')}</tbody></table></div><div id="empty" hidden>No shops match your filters.</div><div class="count" id="count" aria-live="polite">Showing ${total} of ${total} shops</div></section>
<footer>Source: <a href="data.md">data.md</a> · One row per shop. Plan counts use the billingPlan recorded in the supplied export.<br>The export has no column headers; shop, audience, plan and billing interval are read from their consistent positions. Purchase status is supplied by the cohort selection, not independently verified. One shop has a subscription-verification error and remains included.</footer>
</main><script>
const search=document.getElementById('search'),plan=document.getElementById('plan'),items=[...document.querySelectorAll('tr[data-shop]')];
function filter(){let count=0;for(const row of items){const show=row.dataset.shop.includes(search.value.trim().toLowerCase())&&(!plan.value||row.dataset.plan===plan.value);row.hidden=!show;if(show)count++;}document.getElementById('count').textContent='Showing '+count+' of '+items.length+' shops';document.getElementById('empty').hidden=count!==0;}search.addEventListener('input',filter);plan.addEventListener('change',filter);
</script></body></html>`;
assert.equal(counts.reduce((a,b)=>a+b,0),total);
const finalHtml = html
  .replace('<section class="panel table-panel"><div class="toolbar">', revenueSection+'<section class="panel table-panel"><div class="toolbar">')
  .replace('<th>Billing interval</th>', '<th>Billing interval</th><th>MRR (USD)</th>')
  .replace(/(<tr data-shop="([^"]+)"[\s\S]*?)<\/tr>/g, (match,prefix,shop)=>{
    const row=rows.find(r=>esc(r.shop)===shop);
    assert.ok(row);
    return prefix+`<td>${usd(row.mrr)}</td></tr>`;
  });
await fs.writeFile(new URL('analysis.html',dir),finalHtml);
console.log(JSON.stringify({mrrUsd:mrr/100,annualizedUsd:mrr*12/100,excludingVerificationErrorUsd:(mrr-issueMrr)/100,byPlan:planRevenue.map(p=>({plan:p.plan,mrrUsd:p.mrr/100}))}));
console.log(JSON.stringify({shops:total,plans:Object.fromEntries(plans.map((p,i)=>[p,counts[i]])),legacy,annual,verificationErrors:rows.filter(r=>r.issue).length}));
