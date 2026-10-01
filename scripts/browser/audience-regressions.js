/* eslint-disable @typescript-eslint/no-unused-expressions */
async (page) => {
  await page
    .getByRole('textbox', { name: 'CSV contents' })
    .fill('email,first_name\nreader@example.com,Reader\nother@example.com,Other');
  await page.getByRole('button', { name: 'Inspect CSV columns', exact: true }).click();
  await page.getByRole('button', { name: 'Run mapped dry run', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm mapped fixture import' }).click();
  await page
    .getByRole('combobox', { name: 'Contact to organize' })
    .selectOption({ label: 'reader@example.com' });
  await page.getByRole('textbox', { name: 'Definition name', exact: true }).fill('QA VIP');
  let tagRequests = 0;
  const count = (r) => {
    if (r.url().endsWith('/v1/tags') && r.method() === 'POST') tagRequests++;
  };
  page.on('request', count);
  await page.getByRole('button', { name: 'Create definition', exact: true }).evaluate((button) => {
    button.click();
    button.click();
  });
  await page.getByText('Audience definition created.', { exact: true }).waitFor();
  page.off('request', count);
  if (tagRequests !== 1) throw new Error('Repeated clicks issued multiple tag commands.');
  await page.getByRole('combobox', { name: 'Definition type' }).selectOption('lists');
  await page.getByRole('textbox', { name: 'Definition name', exact: true }).fill('QA autumn list');
  await page.getByRole('button', { name: 'Create definition', exact: true }).click();
  await page.getByRole('checkbox', { name: 'QA autumn list' }).waitFor();
  await page.getByRole('combobox', { name: 'Definition type' }).selectOption('contact-fields');
  await page.getByRole('textbox', { name: 'Definition name', exact: true }).fill('Reader score');
  await page.getByRole('textbox', { name: 'Field key' }).fill('reader_score');
  await page.getByRole('combobox', { name: 'Field type' }).selectOption('number');
  await page.getByRole('button', { name: 'Create definition', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Reader score' }).fill('9');
  await page.getByRole('checkbox', { name: 'QA VIP' }).check();
  await page.getByRole('checkbox', { name: 'QA autumn list' }).check();
  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'Save contact organization', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: /fetch/i }).waitFor();
  if ((await page.getByRole('spinbutton', { name: 'Reader score' }).inputValue()) !== '9')
    throw new Error('Offline save lost typed values.');
  await page.context().setOffline(false);
  await page.getByRole('button', { name: 'Save contact organization', exact: true }).click();
  await page
    .getByText('Contact organization saved. Permission and blocks are preserved.', { exact: true })
    .waitFor();
  await page.getByRole('textbox', { name: 'Segment name' }).fill('QA VIP readers');
  await page.getByRole('combobox', { name: 'Condition 1 field' }).selectOption('reader_score');
  await page.getByRole('combobox', { name: 'Condition 1 comparison' }).selectOption('gte');
  await page.getByRole('spinbutton', { name: 'Condition 1 value' }).fill('5');
  await page.getByRole('button', { name: 'Add condition', exact: true }).click();
  await page.getByRole('combobox', { name: 'Condition 2 type' }).selectOption('tag');
  await page.getByRole('combobox', { name: 'Condition 2 field' }).selectOption({ label: 'QA VIP' });
  await page.getByRole('button', { name: 'Create segment', exact: true }).click();
  await page.getByText('Segment version saved.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Preview saved segment' }).click();
  await page.getByText('Matched', { exact: false }).filter({ hasText: '1' }).waitFor();
  await page.getByRole('button', { name: 'Freeze saved selection' }).click();
  await page.getByText('Selection frozen · v1', { exact: true }).waitFor();
  await page.screenshot({ path: 'output/playwright/lettercape-audience.png', fullPage: true });
  await page.getByRole('combobox', { name: 'Condition 1 comparison' }).selectOption('gt');
  await page.getByRole('spinbutton', { name: 'Condition 1 value' }).fill('20');
  await page.getByRole('button', { name: 'Save new segment version' }).click();
  await page.getByText('Segment version saved.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Preview saved segment' }).click();
  await page.getByText('Matched', { exact: false }).filter({ hasText: '0' }).waitFor();
  await page.reload();
  await page
    .getByRole('combobox', { name: 'Saved segment' })
    .selectOption({ label: 'QA VIP readers · v2' });
  await page.getByRole('spinbutton', { name: 'Condition 1 value' }).waitFor();
  if ((await page.getByRole('spinbutton', { name: 'Condition 1 value' }).inputValue()) !== '20')
    throw new Error('Saved segment version did not survive reload.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('heading', { name: 'Segments & frozen selections' })
    .scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error('Mobile audience has horizontal overflow.');
  await page.screenshot({ path: 'output/playwright/lettercape-audience-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 900 });
  return {
    repeatedClicks: 'one command',
    offlineValues: 'retained',
    savedVersion: 2,
    matched: 0,
    eligible: 0,
    mobileOverflow: false,
  };
};
