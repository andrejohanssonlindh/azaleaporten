import { expect, test, type Page } from '@playwright/test';
import { answer, newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-v-${name}.png`, fullPage: true });
};

async function enterVuxen(page: Page) {
  await page.goto('./#/vuxen');
  const q = await page.getByText(/Hur mycket är/).innerText();
  const [, a, b] = q.match(/(\d+) × (\d+)/)!;
  await page.getByLabel('Svar').fill(String(Number(a) * Number(b)));
  await page.getByRole('button', { name: 'Gå in' }).click();
}

test('Vuxenläge visar tid, färdigheter och pass efter en runda', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Talbergen' }).click();
  await page.getByRole('button', { name: /Tiokompisbron/ }).click();
  await page.getByRole('button', { name: /Spela: Tiokompisar/ }).click();
  for (let i = 0; i < 10; i++) await answer(page, i === 0);
  await expect(page.locator('.result-card')).toBeVisible();

  await enterVuxen(page);
  await expect(page.getByRole('heading', { name: 'Hur går det?' })).toBeVisible();
  await page.locator('.overview summary').click();
  await expect(page.getByText(/Aktiv tid per dag/)).toBeVisible();
  await expect(page.locator('.tc-col')).toHaveCount(14);
  await expect(page.locator('.skillmap-area')).toContainText('Tiokompisbron');
  await expect(page.locator('.skillmap-chips .skill-chip').first()).toBeVisible();
  await expect(page.locator('.session-list li')).toContainText('10 frågor · 90 % rätt direkt');
  await expect(page.getByText('Senaste nedladdade kopia:')).toContainText('ingen än');
  await shot(page, '1-oversikt');
});

test('en andra flik tar över, och den första vilar tills man byter tillbaka', async ({ page, context }) => {
  await newHero(page);
  const other = await context.newPage();
  await other.route('**/packs/familj.enc', (r) => r.fulfill({ status: 404, body: '' }));
  await other.goto('./');
  await expect(other.getByRole('group', { name: 'Karta över ön' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spela här i stället' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Karta över ön' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Spela här i stället' }).click();
  await expect(page.getByRole('group', { name: 'Karta över ön' })).toBeVisible();
  await expect(other.getByRole('button', { name: 'Spela här i stället' })).toBeVisible();
});
