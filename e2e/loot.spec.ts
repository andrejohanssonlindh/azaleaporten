import { expect, test, type Page } from '@playwright/test';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-l-${name}.png`, fullPage: true });
};

test('kista → använd föremål → smedjan', async ({ page }) => {
  await page.route('**/packs/familj.enc', (r) => r.fulfill({ status: 404, body: '' }));
  await page.goto('./');
  await page.getByRole('button', { name: 'Öppna porten' }).click();
  await page.getByLabel('Ditt namn').fill('Hjälte3');
  for (let i = 0; i < 5; i++) {
    if (i === 4) await page.getByRole('button', { name: '4', exact: true }).click();
    await page.getByRole('button', { name: 'Nästa' }).click();
  }
  await page.getByRole('button', { name: 'Kliv in i riket!' }).click();
  // En väntande Pionjärkista (som efter import från v0.1) och lite valuta.
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const k = `azaleaporten:h:${id}:hero`;
    const s = JSON.parse(localStorage.getItem(k)!);
    localStorage.setItem(k, JSON.stringify({ ...s, kastanjer: 120, blad: 20, legacy: { pioneerChest: 'pending' } }));
  });
  await page.goto('./#/gard');
  await page.getByRole('button', { name: /Pionjärkistan/ }).click();
  await shot(page, '1-kista');
  await page.getByRole('button', { name: 'Öppna!' }).click();
  await expect(page.getByText('Pionjärmanteln').first()).toBeVisible();
  await shot(page, '2-oppnad');
  await page.getByRole('button', { name: 'Toppen!' }).click();
  await page.getByRole('button', { name: 'Använd' }).first().click();
  await expect(page.getByRole('button', { name: 'Ta av' })).toHaveCount(1);
  await shot(page, '3-garden');

  await page.goto('./#/smedjan');
  await page.locator('.shop-row').first().getByRole('button').click();
  await page.getByRole('tab', { name: 'Förbättra' }).click();
  await shot(page, '4-smedjan');
  await page.goto('./#/gard');
  await expect(page.getByRole('heading', { name: /Oöppnade kistor \(1\)/ })).toBeVisible();
});
