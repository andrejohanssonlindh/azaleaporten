import { expect, type Page } from '@playwright/test';

// Gemensamma steg för e2e-testerna.

export async function newHero(page: Page) {
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
  // En oläst lektion öppnas av sig själv när en bana börjar. Testerna som inte handlar om den hoppar över den.
  await page.addLocatorHandler(page.getByRole('button', { name: 'Hoppa över', exact: true }), (b) => b.click());
}

/** Räknar ut svaret ur uppställningen på skärmen (rutan är input-fältet). */
export async function solve(page: Page): Promise<number> {
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

export async function answer(page: Page, wrongFirst = false) {
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

