/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI callback evaluated by run-code. */
async (page) => {
  page.on('dialog',dialog=>dialog.accept());
  await page.unrouteAll({behavior:'wait'});

  await page.getByRole('textbox',{name:'Subject',exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Heading',exact:true}).waitFor();
  await page.getByRole('button',{name:'HTML',exact:true}).first().click();
  const importPattern='**/v1/emails/*/import-html';
  await page.route(importPattern,async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
  await page.getByRole('textbox',{name:'Heading',exact:true}).fill('The exact newly acknowledged heading');
  const rawRequest=page.waitForRequest(r=>r.url().includes('/import-html'));
  await page.getByRole('button',{name:'Edit raw HTML',exact:true}).click();
  await rawRequest;
  if(!await page.getByRole('textbox',{name:'Subject',exact:true}).evaluate(el=>el.readOnly))throw new Error('destructive transition accepts typing');
  await page.getByRole('button',{name:'Use basic editor',exact:true}).click();await page.getByRole('textbox',{name:'Raw HTML source',exact:true}).waitFor();
  if(!(await page.getByRole('textbox',{name:'Raw HTML source',exact:true}).inputValue()).includes('The exact newly acknowledged heading'))throw new Error('raw conversion used stale preview');
  await page.unroute(importPattern);
  // A checkpoint response arriving after a new local edit must not attach as current.
  const freezePattern='**/v1/emails/*/revisions';
  await page.route(freezePattern,async route=>{const response=await route.fetch();await new Promise(r=>setTimeout(r,600));await route.fulfill({response});});
  const freezeRequest=page.waitForRequest(r=>r.url().endsWith('/revisions')&&r.method()==='POST');
  await page.getByRole('button',{name:'Review and check',exact:true}).click();
  await freezeRequest;
  await page.getByRole('textbox',{name:'Subject',exact:true}).fill('A newer subject after checkpoint request');
  await page.getByRole('alert').filter({hasText:'draft changed during freezing'}).waitFor();
  if(await page.getByRole('heading',{name:'Review evidence',exact:true}).count())throw new Error('stale report attached');
  await page.unroute(freezePattern);
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('status').filter({hasText:/Saved/}).waitFor();
  await page.screenshot({path:'output/playwright/lettercape-reviewed-editor.png'});
}
