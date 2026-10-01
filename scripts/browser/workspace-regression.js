/* global FIXTURE */
/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI callback evaluated by run-code. */
async(page)=>{
 const {owner,billing}=FIXTURE;
 await page.evaluate(owner=>localStorage.setItem('mailcraft.workspace',owner),owner);
 await page.goto('http://127.0.0.1:3000/app');
 await page.getByRole('combobox',{name:'Active brand workspace',exact:true}).waitFor();
 await page.getByRole('link').filter({hasText:'QA autumn story'}).waitFor();
 const pattern='**/v1/emails';
 await page.route(pattern,async route=>{if(route.request().headers()['x-workspace-id']===owner){const response=await route.fetch();await new Promise(r=>setTimeout(r,500));await route.fulfill({response});}else await route.continue();});
 await page.getByRole('combobox',{name:'Active brand workspace',exact:true}).selectOption(billing);
 await page.getByRole('alert').filter({hasText:'role cannot perform'}).waitFor();
 if(await page.getByRole('link').filter({hasText:'QA autumn story'}).count())throw new Error('REGRESSION: previous-workspace email content remains visible to Billing workspace');
 await page.unroute(pattern);
 await page.getByRole('combobox',{name:'Active brand workspace',exact:true}).selectOption(owner);
 await page.getByRole('link').filter({hasText:'QA autumn story'}).waitFor();
 await page.screenshot({path:'output/playwright/lettercape-workspace-isolation.png'});
}
