/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI callback. */
async (page) => {
  await page.getByRole('combobox', { name: 'Saved segment' }).selectOption({ label: 'QA VIP readers · v2' });
  await page.getByRole('spinbutton', { name: 'Condition 1 value' }).waitFor();
  await page.getByRole('combobox', { name: 'Saved segment' }).selectOption('');
  await page.getByRole('textbox', { name: 'Segment name' }).fill('QA boolean false');
  await page.getByRole('combobox', { name: 'Condition 1 field' }).selectOption('vip_status');
  await page.getByRole('combobox', { name: 'Condition 1 comparison' }).selectOption('eq');
  if (await page.getByRole('combobox', { name: 'Condition 1 value' }).inputValue() !== 'false') throw new Error('No is not selected');
  await page.getByRole('button', { name: 'Create segment', exact: true }).click();
  await page.getByText('Segment version saved.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Preview saved segment' }).click();
  await page.getByText(/Version 1 evaluated/).waitFor();
  const change = await page.evaluate(async () => {
    const workspace = (await (await fetch('/v1/workspaces')).json()).data[0].id;
    const headers = { 'X-Workspace-Id': workspace, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() };
    const segment = (await (await fetch('/v1/segments', { headers })).json()).data.find((s) => s.name === 'QA boolean false');
    const old = await (await fetch('/v1/segments/' + segment.id, { headers })).json();
    if (old.segment.rule.children[0].value !== false) throw new Error('Displayed No did not save false.');
    const response = await fetch('/v1/segments/' + segment.id + '/versions', { method: 'POST', headers, body: JSON.stringify({ expected_version: 1, rule: { kind: 'attribute', field: 'first_name', op: 'exists' } }) });
    if (!response.ok) throw new Error('Concurrent fixture edit failed.');
    return { old: 1, current: 2 };
  });
  await page.getByRole('button', { name: 'Freeze saved selection' }).click();
  await page.getByRole('alert').filter({ hasText: 'Reload and review its latest version before freezing.' }).waitFor();
  if (await page.getByText(/Selection frozen/).count()) throw new Error('Stale freeze displayed success.');
  if (await page.getByRole('combobox', { name: 'Condition 1 value' }).inputValue() !== 'false') throw new Error('Conflict discarded displayed rule.');
  await page.screenshot({ path: 'output/playwright/lettercape-segment-conflict.png' });
  return { booleanNoSaved: true, concurrentEdit: change, staleFreeze: 'rejected; displayed rule preserved' };
};
