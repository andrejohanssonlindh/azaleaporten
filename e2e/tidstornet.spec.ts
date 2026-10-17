import { expect, test, type Page } from '@playwright/test';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-t-${name}.png`, fullPage: true });
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
  await page.addLocatorHandler(page.getByRole('button', { name: 'Hoppa över', exact: true }), (b) => b.click());
}

/** Svarar på en flervalsfråga: provar alternativ tills den är klar (fel måste rättas). */
async function answerChoice(page: Page) {
  // Många fel i rad: Mästare Kastanj föreslår Klassrummet en gång (se klassrum.spec.ts).
  const skip = page.getByRole('button', { name: 'Jag kör vidare' });
  if (await skip.isVisible()) await skip.click();
  const next = page.getByRole('button', { name: /^(Nästa|Se resultat)$/ });
  for (let i = 0; i < 4 && !(await next.isVisible()); i++) {
    await page.locator('.choice:not([disabled])').first().click();
  }
  await next.click();
}

test('ön → Talbergen → Tidstornet → en hel runda med resultat', async ({ page }) => {
  await newHero(page);
  await shot(page, '1-on');
  await page.getByRole('button', { name: 'Talbergen' }).click();
  await shot(page, '2-talbergen');
  await page.getByRole('button', { name: /Tidstornet/ }).click();
  await expect(page.getByRole('heading', { name: 'Tidstornet' })).toBeVisible();
  await shot(page, '3-tornet');

  await page.getByRole('button', { name: /Spela: Minutvisaren/ }).click();
  await expect(page.locator('.run-dots .dot')).toHaveCount(10);
  await shot(page, '4-fraga');
  for (let i = 0; i < 10; i++) await answerChoice(page);
  await expect(page.locator('.result-card')).toBeVisible();
  await shot(page, '5-resultat');
});

test('omladdning mitt i en runda fortsätter med samma fråga', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/spela/tidstornet/minutvisaren');
  await answerChoice(page);
  const before = await page.locator('.choices').innerText();
  await page.reload();
  await expect(page.locator('.run-dots .dot.ok, .run-dots .dot.bad')).toHaveCount(1);
  expect(await page.locator('.choices').innerText()).toBe(before);
});

test('boss: intro och strid', async ({ page }) => {
  await newHero(page);
  // Lås upp Halvsaurus genom att markera banorna före den som klara.
  await page.evaluate(() => {
    const meta = JSON.parse(localStorage.getItem('azaleaporten:meta')!);
    const id = meta.heroes[0];
    const st = { stars: 2, cleared: true, best: 10, runs: 1 };
    localStorage.setItem(`azaleaporten:h:${id}:area:tidstornet`, JSON.stringify({ v: 1, stages: { minutvisaren: st, 'forsta-orden': st, 'ord-blir-siffror': st, kvarten: st, 'kvart-siffror': st }, bosses: {}, xp: 0 }));
  });
  await page.goto('./#/omrade/tidstornet');
  await page.getByRole('button', { name: /Möt Halvsaurus/ }).click();
  await expect(page.getByRole('heading', { name: 'Halvsaurus' })).toBeVisible();
  await shot(page, '6-boss-intro');
  await page.getByRole('button', { name: /Strid/ }).click();
  await expect(page.locator('.hpbar')).toBeVisible();
  await shot(page, '7-boss-strid');
});

test('tidslabbet och tolkaren', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/labb/tidstornet/tolka');
  await page.getByLabel('Tid att tolka').fill('tio i halv elva på kvällen');
  await expect(page.locator('.tolka-digital')).toHaveText('22:20');
  await shot(page, '8-tolka');
  await page.getByRole('tab', { name: 'Öva fritt' }).click();
  await page.getByRole('button', { name: 'Ord → siffror' }).click();
  await page.getByLabel('Tid med siffror').fill('25:99');
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.getByRole('alert')).toContainText('Skriv t.ex.');
  await shot(page, '9-labb');
});
