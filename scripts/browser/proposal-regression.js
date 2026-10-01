/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI callback evaluated by run-code. */
async(page)=>{
 await page.getByRole('textbox',{name:'Subject',exact:true}).waitFor();
 const spec=await page.evaluate(async()=>{const workspace=localStorage.getItem('mailcraft.workspace'),id=location.pathname.split('/').at(-1);return (await(await fetch('/v1/emails/'+id,{headers:{'X-Workspace-Id':workspace}})).json()).email.spec;});
 const operation='e6f9ffdf-22bb-479c-abdd-034fe959fcfa';
 // Controlled test fixture for stale-response handling. This makes no AI provider request.
 await page.route('**/v1/emails/generate',route=>route.fulfill({status:202,contentType:'application/json',body:JSON.stringify({operation:{id:operation}})}));
 const pollPattern='**/v1/operations/'+operation;
 await page.route(pollPattern,async route=>{await new Promise(r=>setTimeout(r,600));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({operation:{state:'succeeded',result:{proposals:[{spec:{...spec,subject:'Controlled fixture proposal'},review_notes:['Test fixture only — no AI provider invoked']}]}}})});});
 await page.getByRole('textbox',{name:'Propose changes',exact:true}).fill('Controlled stale-proposal regression fixture');
 const generated=page.waitForRequest(r=>r.url().endsWith('/emails/generate'));
 await page.getByRole('button',{name:'Generate proposal',exact:true}).click();
 await generated;
 await page.getByRole('textbox',{name:'Subject',exact:true}).fill('Newer unsaved work after generation starts');
 await page.getByRole('button',{name:'Apply proposal',exact:true}).waitFor();
 if(!await page.getByRole('button',{name:'Apply proposal',exact:true}).isDisabled())throw new Error('stale proposal can overwrite unsaved work');
 if(await page.getByRole('textbox',{name:'Subject',exact:true}).inputValue()!=='Newer unsaved work after generation starts')throw new Error('newer local work lost');
 await page.getByRole('button',{name:'Discard',exact:true}).click();
 await page.unroute('**/v1/emails/generate');await page.unroute(pollPattern);
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('status').filter({hasText:/Saved/}).waitFor();
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.screenshot({path:'output/playwright/lettercape-reviewed-preview.png'});
}
