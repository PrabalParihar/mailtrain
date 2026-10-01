/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI callback. */
async (page) => {
  await page.getByRole('link', { name: 'Audience', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'CSV contents' })
    .fill('email,consent\nreader@example.com,subscribed\nREADER@example.com,unsubscribed');
  await page.getByRole('button', { name: 'Inspect CSV columns' }).click();
  await page
    .getByRole('combobox', { name: 'Consent status column', exact: true })
    .selectOption('consent');
  await page.getByRole('button', { name: 'Run mapped dry run' }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'Resolve conflicting consent rows before importing this file.' })
    .waitFor();
  if (!(await page.getByRole('button', { name: 'Confirm mapped fixture import' }).isDisabled()))
    throw new Error('Conflicting consent can confirm.');
  const claims = await page.locator('.import-errors').innerText();
  if (!claims.includes('Claim: subscribed') || !claims.includes('Claim: unsubscribed'))
    throw new Error('Conflicting claim evidence discarded.');
  const csv = [
    'email',
    ...Array.from({ length: 100 }, (_, i) => `late-ui${i}@example.com`),
    'invalid',
  ].join('\n');
  await page.getByRole('textbox', { name: 'CSV contents' }).fill(csv);
  await page.getByRole('button', { name: 'Inspect CSV columns' }).click();
  await page.getByRole('button', { name: 'Run mapped dry run' }).click();
  await page.getByRole('heading', { name: 'Rejected rows · 1', exact: true }).waitFor();
  if (
    (await page.locator('.import-errors tbody tr').first().locator('td').first().innerText()) !==
    '102'
  )
    throw new Error('Error after success sample hidden.');
  const many = ['email', ...Array.from({ length: 201 }, () => 'invalid')].join('\n');
  await page.getByRole('textbox', { name: 'CSV contents' }).fill(many);
  await page.getByRole('button', { name: 'Inspect CSV columns' }).click();
  await page.getByRole('button', { name: 'Run mapped dry run' }).click();
  await page.getByRole('heading', { name: 'Rejected rows · 201', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next error page' }).click();
  await page.locator('.import-errors tbody tr').filter({ hasText: '102' }).waitFor();
  if (
    (await page.locator('.import-errors tbody tr').first().locator('td').first().innerText()) !==
    '102'
  )
    throw new Error('Error page did not advance.');
  await page.getByRole('button', { name: 'Next error page' }).click();
  await page.locator('.import-errors tbody tr').filter({ hasText: '202' }).waitFor();
  if ((await page.locator('.import-errors tbody tr').count()) !== 1)
    throw new Error('Final error page is incorrect.');
  await page.screenshot({ path: 'output/playwright/lettercape-import-errors.png' });
  page.removeAllListeners('dialog');
  const dialogPromise = page.waitForEvent('dialog');
  const click = page.getByRole('link', { name: 'Home', exact: true }).click();
  const dialog = await dialogPromise;
  if (!dialog.message().includes('Unconfirmed CSV')) throw new Error('Missing navigation guard.');
  await dialog.dismiss();
  await click;
  if (
    !page.url().endsWith('/app/audience') ||
    (await page.getByRole('textbox', { name: 'CSV contents' }).inputValue()) !== many
  )
    throw new Error('Dismissed navigation lost import input.');
  return {
    conflict: 'all rows blocked; claims retained',
    lateError: 102,
    errorPages: 3,
    navigationGuard: 'dismiss preserves input',
  };
};
