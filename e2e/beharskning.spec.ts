import { expect, test, type Page } from '@playwright/test';
import { answer, newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-b-${name}.png`, fullPage: true });
};

test('behärskning: en repetition som sitter ger kunskap, och Kunskaper visar det', async ({ page }) => {
  await newHero(page);
  // Sjuans tabell satt i låda 1 och är dags idag; nästan nivå 5 i Tabellkraft.
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const d = new Date();
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const item = { box: 1, best: 1, due: day, seen: 3, correct: 3, area: 'tabellgruvan', lastSeen: day };
    localStorage.setItem(`azaleaporten:h:${id}:skills`, JSON.stringify({ v: 1, items: { 'ma.mult.7': item }, seeded: true }));
    localStorage.setItem(`azaleaporten:h:${id}:area:tabellgruvan`, JSON.stringify({ v: 1, stages: {}, bosses: {}, xp: 395 }));
  });
  await page.goto('./#/repetera/tabellgruvan');
  for (let i = 0; i < 5; i++) await answer(page);
  await expect(page.getByText(/Sitter bättre än någonsin: sjuans tabell \(\+10 kunskap\)/)).toBeVisible();
  await expect(page.getByText('⛏️ Tabellkraft nivå 5!')).toBeVisible();
  await expect(page.getByText('🏷️ Ny titel: Tabellgrävare')).toBeVisible();
  await shot(page, '1-resultat');

  await page.goto('./#/gard');
  await page.getByRole('tab', { name: 'Kunskaper' }).click();
  await expect(page.getByText(/Nivå 10: titeln Gångergeni/)).toBeVisible();
  await shot(page, '2-kunskaper');
});
