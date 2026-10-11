import { expect, test, type Page } from '@playwright/test';
import { answer, newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-d-${name}.png`, fullPage: true });
};

test('dag 1: en runda med ett fel → dag 2: dimma, Kastanj, repetition och uppdrag', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 12, 16, 0));
  await newHero(page);
  await page.goto('./#/uppdrag');
  await expect(page.locator('.quest')).toHaveCount(3);
  await shot(page, '1-uppdrag-dag1');

  await page.goto('./#/spela/tiokompisbron/tiokompisar');
  for (let i = 0; i < 10; i++) await answer(page, i === 0);
  await expect(page.getByRole('heading', { name: 'Bron håller!' })).toBeVisible();
  await expect(page.getByText(/Uppdrag klart/).first()).toBeVisible();

  // Nästa dag.
  await page.clock.setFixedTime(new Date(2026, 9, 13, 16, 0));
  await page.goto('./#/karta');
  await page.reload();
  await expect(page.locator('.isle-mist')).toHaveCount(1);
  await expect(page.getByText(/Glömskans dimma har krupit in över/)).toBeVisible();
  await shot(page, '2-karta-dimma');

  await page.goto('./#/uppdrag');
  await expect(page.getByText('Jaga bort dimman i Tiokompisbron')).toBeVisible();
  await page.goto('./#/omrade/tiokompisbron');
  await expect(page.getByText('Glömskans dimma ligger här')).toBeVisible();
  await page.goto('./#/karta');

  await page.getByRole('button', { name: /Ja, kör!/ }).click();
  await expect(page.getByText('Jaga bort dimman', { exact: true })).toBeVisible();
  await expect(page.locator('.run-dots .dot')).toHaveCount(5);
  await shot(page, '3-repetition');
  for (let i = 0; i < 5; i++) await answer(page);
  await expect(page.getByRole('heading', { name: 'Dimman har lättat!' })).toBeVisible();
  await expect(page.getByText(/Uppdrag klart: Jaga bort dimman/)).toBeVisible();
  await shot(page, '4-dimman-borta');

  await page.goto('./#/ovning');
  await expect(page.locator('.mist-item')).toHaveCount(0);
  await page.goto('./#/karta');
  await expect(page.locator('.isle-mist')).toHaveCount(0);
});
