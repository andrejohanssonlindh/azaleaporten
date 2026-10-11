import { expect, test, type Page } from '@playwright/test';
import { encryptPack } from '../src/platform/gate/crypto';

// Skärmdumpar sparas om SHOTS=<mapp> är satt.
const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-${name}.png`, fullPage: true });
};

const PASSWORD = 'test-ord-ord-ord';
const testPack = () => encryptPack(
  { format: 'azaleaporten-familjepaket', v: 1, personas: [{ boss: 'talbergen.region', name: 'Testmästaren', title: 't', entrance: 'e', defeat: 'd' }] },
  PASSWORD, { iterations: 1000 },
);

async function createHero(page: Page, name: string) {
  await page.getByLabel('Ditt namn').fill(name);
  await page.getByRole('button', { name: 'Nästa' }).click();
  await page.getByRole('button', { name: /Uggla/ }).click();
  await shot(page, '3-djur');
  await page.getByRole('button', { name: 'Nästa' }).click();
  await page.getByRole('button', { name: 'Havsblå' }).click();
  await page.getByRole('button', { name: 'Nästa' }).click();
  await page.getByRole('button', { name: /Trollkarl/ }).click();
  await shot(page, '4-klass');
  await page.getByRole('button', { name: 'Nästa' }).click();
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'Nästa' }).click();
  await shot(page, '5-klar');
  await page.getByRole('button', { name: 'Kliv in i riket!' }).click();
}

test('porten med familjepaket: fel lösenord, rätt lösenord, ny hjälte, kvar efter omladdning', async ({ page }) => {
  const pack = await testPack();
  await page.route('**/packs/familj.enc', (r) => r.fulfill({ json: pack }));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Azaleaporten' })).toBeVisible();
  await shot(page, '1-porten');

  await page.getByLabel('Viska portens lösenord').fill('fel-fel-fel-fel');
  await page.getByRole('button', { name: 'Öppna porten' }).click();
  await expect(page.getByText('Porten förblir stängd')).toBeVisible();

  await page.getByLabel('Viska portens lösenord').fill('Test Ord Ord Ord');
  await page.getByRole('button', { name: 'Öppna porten' }).click();
  await expect(page.getByRole('heading', { name: 'Vad heter du, hjälte?' })).toBeVisible();
  await shot(page, '2-namn');

  await createHero(page, 'Hjälte1');
  await expect(page.getByText('Välkommen till Azaleaporten, Hjälte1!')).toBeVisible();
  await expect(page.getByText('Passar dig').first()).toBeVisible();
  await shot(page, '6-karta');

  await page.reload();
  await expect(page.getByText(/Hej igen, Hjälte1/)).toBeVisible();
  await expect(page.getByLabel('Viska portens lösenord')).toHaveCount(0);

  await page.getByRole('button', { name: /Hjälte1s hjälteblad/ }).click();
  await expect(page.getByRole('heading', { name: /Azaleagården/ })).toBeVisible();
  await shot(page, '7-garden');

  await page.getByRole('button', { name: '← Till kartan' }).click();
  await page.getByRole('button', { name: 'Byt hjälte' }).click();
  await page.getByRole('button', { name: 'Vuxenläge' }).click();
  const q = await page.getByText(/Hur mycket är/).innerText();
  const [, a, b] = q.match(/(\d+) × (\d+)/)!;
  await page.getByLabel('Svar').fill(String(Number(a) * Number(b)));
  await page.getByRole('button', { name: 'Gå in' }).click();
  await expect(page.getByText('Familjepaketet är upplåst på den här enheten (1 mästare).')).toBeVisible();
  await shot(page, '8-vuxen');
});

test('utan familjepaket öppnas porten med en knapp', async ({ page }) => {
  await page.route('**/packs/familj.enc', (r) => r.fulfill({ status: 404, body: '' }));
  await page.goto('./');
  await expect(page.getByLabel('Viska portens lösenord')).toHaveCount(0);
  await page.getByRole('button', { name: 'Öppna porten' }).click();
  await expect(page.getByRole('heading', { name: 'Vad heter du, hjälte?' })).toBeVisible();
});
