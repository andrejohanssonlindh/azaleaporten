import { expect, test, type Page } from '@playwright/test';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-m-${name}.png`, fullPage: true });
};

async function newHero(page: Page) {
  await page.route('**/packs/familj.enc', (r) => r.fulfill({ status: 404, body: '' }));
  await page.goto('./');
  await page.getByRole('button', { name: 'Öppna porten' }).click();
  await page.getByLabel('Ditt namn').fill('Hjälte2');
  for (let i = 0; i < 5; i++) {
    if (i === 4) await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: 'Nästa' }).click();
  }
  await page.getByRole('button', { name: 'Kliv in i riket!' }).click();
  await expect(page.getByRole('group', { name: 'Karta över ön' })).toBeVisible();
}

/** Räknar ut svaret ur uppställningen på skärmen (rutan är input-fältet). */
async function solve(page: Page): Promise<number> {
  return page.locator('.eq').evaluate((eq) => {
    const parts = [...eq.children].map((c) => (c.tagName === 'INPUT' ? null : c.textContent!.trim()));
    const [a, op, b, , c] = parts;
    const n = (s: string | null) => Number(s);
    const inv: Record<string, (x: number, y: number) => number> = { '+': (x, y) => x - y, '−': (x, y) => x + y, '·': (x, y) => x / y, '/': (x, y) => x * y };
    const fwd: Record<string, (x: number, y: number) => number> = { '+': (x, y) => x + y, '−': (x, y) => x - y, '·': (x, y) => x * y, '/': (x, y) => x / y };
    if (c === null) return fwd[op!](n(a), n(b));
    if (b === null) return op === '+' || op === '·' ? inv[op](n(c), n(a)) : fwd[op!](n(a), n(c));
    return inv[op!](n(c), n(b));
  });
}

async function answer(page: Page, wrongFirst = false) {
  const right = await solve(page);
  const input = page.getByLabel('Ditt svar');
  if (wrongFirst) {
    await input.fill(String(right + 1));
    await page.getByRole('button', { name: 'Rätta' }).click();
    await expect(page.locator('.errcard')).toBeVisible();
  }
  await input.fill(String(right));
  await page.getByRole('button', { name: 'Rätta' }).click();
  await page.getByRole('button', { name: /^(Nästa|Se resultat)$/ }).click();
}

test('Talbergen → Tiokompisbron → en hel runda med ett rättat fel', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Talbergen' }).click();
  await page.getByRole('button', { name: /Tiokompisbron/ }).click();
  await expect(page.getByRole('heading', { name: 'Tiokompisbron' })).toBeVisible();
  await shot(page, '1-bron');
  await page.getByRole('button', { name: /Spela: Tiokompisar/ }).click();
  await expect(page.locator('.run-dots .dot')).toHaveCount(10);
  await expect(page.locator('.tenframe')).toBeVisible();
  await shot(page, '2-fraga');
  for (let i = 0; i < 10; i++) {
    await answer(page, i === 0);
    if (i === 0) await shot(page, '3-ratta');
  }
  await expect(page.locator('.result-card')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bron håller!' })).toBeVisible();
  await shot(page, '4-resultat');
  await page.getByRole('button', { name: 'Till bron' }).click();
  await expect(page.getByRole('button', { name: /Spela: Plus till 20/ })).toBeVisible();
});

test('Tabellgruvan: Plusråttans intro och fri övning', async ({ page }) => {
  await newHero(page);
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const st = { stars: 2, cleared: true, best: 10, runs: 1 };
    localStorage.setItem(`azaleaporten:h:${id}:area:tabellgruvan`, JSON.stringify({ v: 1, stages: { 'tvaan-femman-tian': st, 'dela-lika': st }, bosses: {}, xp: 0 }));
  });
  await page.goto('./#/omrade/tabellgruvan');
  await page.getByRole('button', { name: /Möt Plusråttan/ }).click();
  await expect(page.getByText(/plussar i stället för gånger/)).toBeVisible();
  await page.getByRole('button', { name: /Strid/ }).click();
  await answer(page);
  await expect(page.locator('.hpbar')).toBeVisible();
  await shot(page, '5-plusrattan');

  await page.goto('./#/labb/tabellgruvan');
  await page.getByRole('button', { name: /De svåra tabellerna/ }).click();
  await answer(page);
  await expect(page.getByText('Rätt: 1 av 1')).toBeVisible();
  await shot(page, '6-ova-fritt');
});
