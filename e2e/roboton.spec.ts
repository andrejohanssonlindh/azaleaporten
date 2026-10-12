import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

// Robotön (programmering): bygg ett program (fel tre gånger → visa en lösning → kör), var hamnar roboten,
// hitta buggen, Logikslingans regelkort och Pythonhamnens kod.

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-r-${name}.png`, fullPage: true });
};

/** Trycker på alternativen i tur och ordning tills ett är rätt. */
async function tryAll(page: Page, buttons: ReturnType<Page['locator']>) {
  const n = await buttons.count();
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(i);
    if (await b.isDisabled()) continue;
    await b.click();
    if (await page.locator('.feedback.ok').isVisible()) return;
    await expect(page.locator('.errcard')).toBeVisible();
  }
}

test('Robotön → Kodstigen: bygg, kör, fel tre gånger och visa en lösning', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Robotön' }).click();
  await expect(page.getByText('Programmering')).toBeVisible();
  await shot(page, '1-on');
  await page.getByRole('button', { name: /Kodstigen/ }).click();
  await page.getByRole('button', { name: /Spela: Första stegen/ }).click();
  await expect(page.locator('.rb-grid')).toBeVisible();
  // Ett enda block räcker aldrig här (batteriet ligger minst två steg bort).
  for (let k = 0; k < 3; k++) {
    if (k > 0) await page.getByRole('button', { name: 'Töm' }).click();
    await page.getByRole('button', { name: 'Lägg till Upp' }).click();
    if (k === 0) await shot(page, '2-bygg');
    await page.getByRole('button', { name: '▶ Kör' }).click();
    await expect(page.locator('.errcard')).toBeVisible();
  }
  await shot(page, '3-fel');
  await page.getByRole('button', { name: 'Visa en lösning' }).click();
  await page.getByRole('button', { name: '▶ Kör' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await expect(page.getByText('Så här kan programmet se ut.')).toBeVisible();
  await shot(page, '4-klar');
});

test('Kodstigen: var hamnar roboten? och loopar och buggar i fri övning', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/kodstigen');
  await page.getByRole('button', { name: /Robotens vänster/ }).click();
  await expect(page.locator('.rb-spot')).toHaveCount(await page.locator('.rb-spot').count());
  await shot(page, '5-vart');
  await tryAll(page, page.getByRole('group', { name: 'Välj ruta' }).getByRole('button'));
  await expect(page.locator('.feedback.ok')).toBeVisible();

  await page.goto('./#/labb/loopverkstaden');
  await page.getByRole('button', { name: /Hur många varv/ }).click();
  await expect(page.locator('.rb-hole')).toBeVisible();
  await shot(page, '6-antal');
  await tryAll(page, page.getByRole('group', { name: 'Välj det som fattas' }).getByRole('button'));
  await expect(page.locator('.feedback.ok')).toBeVisible();

  await page.goto('./#/labb/loopverkstaden');
  await page.getByRole('button', { name: /Bygg med loop/ }).click();
  await page.getByRole('button', { name: '🔁 Loop', exact: true }).click();
  await page.getByRole('button', { name: 'Lägg till Höger' }).click();
  await page.getByRole('button', { name: 'Ett varv till' }).click();
  await expect(page.locator('.rb-loop-head')).toContainText('3 ×');
  await shot(page, '7-loop');

  await page.goto('./#/labb/buggjakten');
  await page.getByRole('button', { name: /Första buggen/ }).click();
  await page.getByRole('button', { name: '▶ Testkör' }).click();
  await expect(page.getByRole('button', { name: '▶ Testkör' })).toBeEnabled();
  await shot(page, '8-bugg');
  await tryAll(page, page.getByRole('group', { name: /tryck på blocket/ }).getByRole('button'));
  await expect(page.locator('.feedback.ok')).toBeVisible();
});

test('Logikslingan och Pythonhamnen', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/logikslingan');
  await page.getByRole('button', { name: /OM … SÅ … ANNARS/ }).click();
  await expect(page.locator('.logik-rule')).toContainText('ANNARS');
  await shot(page, '9-regel');
  await tryAll(page, page.getByRole('group', { name: 'Välj svar' }).getByRole('button'));

  await page.goto('./#/labb/logikslingan');
  await page.getByRole('button', { name: /Steg för steg/ }).click();
  await expect(page.locator('.ordna.lines')).toBeVisible();
  await shot(page, '10-steg');

  await page.goto('./#/labb/pythonhamnen');
  await page.getByRole('button', { name: /for-loopar/ }).click();
  await expect(page.locator('.py-code')).toContainText('range');
  await shot(page, '11-python');
  await tryAll(page, page.getByRole('group', { name: 'Välj svar' }).getByRole('button'));
  await expect(page.locator('.feedback.ok')).toBeVisible();

  await page.goto('./#/labb/pythonhamnen');
  await page.getByRole('button', { name: /Hitta felet/ }).click();
  await expect(page.locator('.ord-tokens.lines.mono')).toBeVisible();
  await shot(page, '12-pyfel');
  await tryAll(page, page.locator('.ord-tokens.lines .ord-token'));
  await expect(page.locator('.feedback.ok')).toBeVisible();
});
