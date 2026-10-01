/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI callback. */
async (page) => {
  await page
    .getByRole('textbox', { name: 'CSV contents' })
    .fill('email,email\na@example.com,b@example.com');
  await page.getByRole('button', { name: 'Inspect CSV columns' }).click();
  await page.getByRole('alert').filter({ hasText: 'unique, nonempty headers' }).waitFor();
  const csv =
    'Address,Name,Points,VIP,Permission,Source,Proof\nmapped@example.com,Mapped,9,true,subscribed,website,form-qa\nbad-type@example.com,Bad,nan,false,subscribed,website,form-bad\nprivate@real-company.com,Private,3,true,subscribed,website,form-private';
  await page
    .getByLabel('CSV file', { exact: true })
    .setInputFiles({ name: 'mapped-fixture.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Inspect CSV columns' }).click();
  await page.getByRole('combobox', { name: 'Email column', exact: true }).selectOption('Address');
  await page.getByRole('combobox', { name: 'First name column', exact: true }).selectOption('Name');
  await page
    .getByRole('combobox', { name: 'Reader score column (number)', exact: true })
    .selectOption('Points');
  await page
    .getByRole('combobox', { name: 'VIP status column (boolean)', exact: true })
    .selectOption('VIP');
  await page
    .getByRole('combobox', { name: 'Consent status column', exact: true })
    .selectOption('Permission');
  await page
    .getByRole('combobox', { name: 'Consent source column', exact: true })
    .selectOption('Source');
  await page
    .getByRole('combobox', { name: 'Consent proof reference column', exact: true })
    .selectOption('Proof');
  await page.getByRole('checkbox', { name: 'List: QA autumn list', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Tag: QA VIP', exact: true }).check();
  await page.getByRole('button', { name: 'Run mapped dry run' }).click();
  await page.getByRole('button', { name: 'Confirm mapped fixture import' }).waitFor();
  await page.getByText('Use a number for reader_score.', { exact: false }).waitFor();
  const section = page.locator('.csv-import');
  if (await section.getByText('private@real-company.com', { exact: true }).count())
    throw new Error('Prohibited address appeared in server preview.');
  await page.getByRole('combobox', { name: 'Consent source column', exact: true }).selectOption('');
  if (await page.getByRole('button', { name: 'Confirm mapped fixture import' }).count())
    throw new Error('Mapping change retained stale confirmation.');
  await page
    .getByRole('combobox', { name: 'Consent source column', exact: true })
    .selectOption('Source');
  await page.getByRole('button', { name: 'Run mapped dry run' }).click();
  await page.getByRole('button', { name: 'Confirm mapped fixture import' }).waitFor();
  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'Confirm mapped fixture import' }).click();
  await page.getByRole('alert').filter({ hasText: /fetch/i }).waitFor();
  if (!(await page.getByRole('button', { name: 'Confirm mapped fixture import' }).count()))
    throw new Error('Lost confirmation erased dry run.');
  await page.context().setOffline(false);
  let confirmations = 0;
  const listener = (r) => {
    if (r.url().includes('/contact-imports/') && r.url().endsWith('/confirm')) confirmations++;
  };
  page.on('request', listener);
  await page.getByRole('button', { name: 'Confirm mapped fixture import' }).evaluate((button) => {
    button.click();
    button.click();
  });
  await page
    .getByRole('status')
    .filter({ hasText: '1 created, 0 existing preserved, 1 held' })
    .waitFor();
  page.off('request', listener);
  if (confirmations !== 1) throw new Error('Repeated confirmation duplicated commands.');
  await page
    .getByRole('combobox', { name: 'Contact to organize' })
    .selectOption({ label: 'mapped@example.com' });
  if (
    (await page.getByRole('spinbutton', { name: 'Reader score', exact: true }).inputValue()) !== '9'
  )
    throw new Error('Mapped number missing.');
  if (
    (await page.getByRole('combobox', { name: 'VIP status', exact: true }).inputValue()) !== 'true'
  )
    throw new Error('Mapped boolean missing.');
  const contactRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: 'mapped@example.com', exact: true }) });
  await contactRow.getByRole('button', { name: 'Block', exact: true }).click();
  await contactRow.getByText('Suppressed', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Run mapped dry run' }).click();
  await page.getByRole('button', { name: 'Confirm mapped fixture import' }).click();
  await page.getByRole('status').filter({ hasText: '0 created, 1 existing preserved' }).waitFor();
  await contactRow.getByText('Suppressed', { exact: true }).waitFor();
  await page.screenshot({ path: 'output/playwright/lettercape-csv-mapping.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByText('Bulk CSV mapping: continue on a larger screen.', { exact: false })
    .waitFor();
  if (await page.getByRole('button', { name: 'Run mapped dry run' }).isVisible())
    throw new Error('Mobile bulk mapping is not gated.');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error('Mobile import overflow.');
  await page.setViewportSize({ width: 1280, height: 900 });
  if ((await page.getByRole('textbox', { name: 'CSV contents' }).inputValue()) !== csv)
    throw new Error('Responsive view lost CSV input.');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('heading', { name: 'Make something worth opening.' }).waitFor();
  return {
    headerError: 'clear',
    fileMapping: 'typed',
    invalidatedPreview: true,
    offlineRetry: 'retained',
    repeatedConfirmation: 'one request',
    suppression: 'preserved',
    mobileInput: 'preserved',
    navigation: 'passed',
  };
};
