import puppeteer from 'puppeteer';
let f=0; const ck=(c,m)=>{console.log((c?'PASS':'FAIL')+' - '+m); if(!c)f++;};
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
const p=await b.newPage();
// dialogs: branch name then (no title prompt since commit-msg prefilled)
p.on('dialog', async d => { await d.accept('test-prbody-1781259624'); });
await p.goto('http://127.0.0.1:3000/#/changes',{waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,800));
// PR body textarea present + prefilled?
const body0 = await p.$eval('#actions-pr-body', e=>e.value).catch(()=>null);
ck(body0 && body0.indexOf('## Changes')!==-1, 'PR-body textarea prefilled with default ('+JSON.stringify(body0)+')');
// Create branch
await p.click('#actions-branch-btn'); await new Promise(r=>setTimeout(r,1500));
// edit the PR body
await p.evaluate(()=>{ const t=document.getElementById('actions-pr-body'); if(t){ t.value='## Custom body for test\n- edited before PR'; } });
// Commit & PR
const resp = p.waitForResponse(r=>r.url().includes('/api/git/commit-pr'),{timeout:20000});
await p.click('#actions-commitpr-btn');
const r = await resp; const data = await r.json();
ck(data.success && /pull\/\d+/.test(data.prUrl||''), 'PR created: '+data.prUrl);
await new Promise(r=>setTimeout(r,1200));
// "Show pull request on GitHub" button present + correct href?
const href = await p.$eval('#actions-pr-link a', a=>a.href).catch(()=>null);
ck(href && /pull\/\d+/.test(href), '"Show pull request on GitHub" button links to PR ('+href+')');
console.log(f===0?'PASSED':f+' FAILED');
await b.close(); process.exit(f?1:0);
