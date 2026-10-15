import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

// Diagramdalen, del två: linje- och cirkeldiagram, lägesmått, diagram som lurar (laga axeln) och tidningens rubriker.

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-d2-${name}.png`, fullPage: true });
};

/** Öppnar en bana i "Öva fritt" och tar en bild. */
async function open(page: Page, area: string, stage: RegExp, name: string) {
  await page.goto(`./#/labb/${area}`);
  await page.getByRole('button', { name: stage }).click();
  await expect(page.locator('.kq.diagram')).toBeVisible();
  await shot(page, name);
}

test('Diagramdalen: de nya områdena visar sina diagram', async ({ page }) => {
  await newHero(page);
  await open(page, 'vaderstationen', /Läs punkten/, '1-linje');
  await expect(page.locator('.dia-line')).toHaveCount(1);
  await open(page, 'vaderstationen', /Dalen och berget/, '2-tva-linjer');
  await expect(page.locator('.dia-line')).toHaveCount(4); // två linjer + två i teckenförklaringen
  await open(page, 'omrostningstorget', /Största biten/, '3-cirkel');
  await expect(page.locator('.dia-bit').first()).toBeVisible();
  await open(page, 'omrostningstorget', /Procent av alla/, '4-procent');
  await open(page, 'vagmastarens-bod', /Sortera först/, '5-median');
  await expect(page.locator('.dia-lapp').first()).toBeVisible();
  await open(page, 'spegelsalen', /Växande bilder/, '6-yta');
  await open(page, 'spegelsalen', /Talby och Ekby/, '7-olika');
  await open(page, 'skvallerpressen', /Bara en bit/, '8-utsnitt');
  await expect(page.locator('.dia-rubrik')).toBeVisible();
  await open(page, 'skvallerpressen', /^Spela: Per person|Per person/, '9-perperson');
  await open(page, 'skvallerpressen', /Glass och solbränna/, '10-samband');
});

test('Spegelsalen: laga axeln så att diagrammet blir ärligt', async ({ page }) => {
  await newHero(page);
  await open(page, 'spegelsalen', /Laga axeln/, '11-laga');
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.errcard')).toBeVisible();
  const ner = page.getByRole('button', { name: 'Flytta ner axelns början' });
  while (await ner.isEnabled()) await ner.click();
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await shot(page, '12-lagad');
});
