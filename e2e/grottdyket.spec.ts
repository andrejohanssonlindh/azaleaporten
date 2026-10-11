import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-cave-${name}.png` });
};

test('Grottdyket: en pollett, gå med tryck och tangenter, lämna och få hälften', async ({ page }) => {
  await newHero(page);
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const k = (s: string) => `azaleaporten:h:${id}:${s}`;
    const hero = JSON.parse(localStorage.getItem(k('hero'))!);
    localStorage.setItem(k('hero'), JSON.stringify({ ...hero, polletter: 1 }));
    const item = (id: string, base: string, slot: string, icon: string, stats: object) => ({ id, base, slot, name: 'Test', icon, rarity: 2, ilvl: 3, stats, plus: 0, foundAt: '' });
    const inv = JSON.parse(localStorage.getItem(k('inventory'))!);
    localStorage.setItem(k('inventory'), JSON.stringify({
      ...inv,
      items: [item('v1', 'bage', 'vapen', '🏹', { tur: 4 }), item('s1', 'lykta', 'skold', '🏮', { klurighet: 6 })],
      equipped: { vapen: 'v1', skold: 's1' },
    }));
  });
  await page.goto('./#/by');
  await page.getByRole('button', { name: /Grottdyket/ }).click();
  await expect(page.getByText('Båge', { exact: true })).toBeVisible();
  await expect(page.getByText('Lykta', { exact: true })).toBeVisible();
  await shot(page, '1-lobby');

  await page.getByRole('button', { name: /Kliv ner \(1/ }).click();
  await page.getByRole('button', { name: /Kliv ner!/ }).click();
  const hero = page.locator('.ce.hero');
  const before = await hero.getAttribute('style');

  // Tryck på en upplyst golvruta en bit bort: hjälten går dit.
  const target = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('.cave-board .ct')];
    const h = document.querySelector('.ce.hero') as HTMLElement;
    const m = /translate\(([-\d.]+)%, ([-\d.]+)%\)/.exec(h.style.transform)!;
    const hx = Number(m[1]) / 100, hy = Number(m[2]) / 100;
    const i = tiles.findIndex((t, i) => t.classList.contains('floor') && t.classList.contains('lit') && Math.abs((i % 9) - hx) + Math.abs(Math.floor(i / 9) - hy) >= 2);
    const r = tiles[i].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(target.x, target.y);
  await expect.poll(() => hero.getAttribute('style')).not.toBe(before);
  await shot(page, '2-walk');
  for (const k of ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Space']) await page.keyboard.press(k);
  await shot(page, '3-keys');

  await page.getByRole('button', { name: /Lämna/ }).click();
  await expect(page.getByText('Lämna grottan?')).toBeVisible();
  await page.getByRole('button', { name: 'Lämna ändå' }).click();
  await expect(page.locator('.result-card')).toContainText('Du föll på våning');
  await shot(page, '4-result');
  const st = await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    return JSON.parse(localStorage.getItem(`azaleaporten:h:${id}:hero`)!);
  });
  expect(st.polletter).toBe(0);
  expect(st.grotta).toMatchObject({ best: 1, dives: 1 });
});
