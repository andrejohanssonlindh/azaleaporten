import { getHeroState, saveHeroState } from '../profiles';
import { KEYS } from './balance';
import { addChest, type Chest } from './inventory';

// Spelnycklar och skattkistorna från minispelen. Nycklarna hittas i vanliga banor; en nyckel gör en
// minispelsrunda till en skattrunda. Skattkistorna (kind 'spel') ger ovanliga saker eller kläder som bara
// finns i dem. Allt här är belöningar – det påverkar aldrig lärandet.

/** Slår om hjälten hittar en nyckel. Returnerar true om den gjorde det. */
export function rollKey(hid: string, boss: boolean, roll = Math.random()): boolean {
  const s = getHeroState(hid);
  if (s.nycklar >= KEYS.max || roll >= (boss ? KEYS.bossChance : KEYS.stageChance)) return false;
  saveHeroState(hid, { ...s, nycklar: s.nycklar + 1 });
  return true;
}

/** Lägger en nyckel. Sparas direkt, som polletterna. */
export function payKey(hid: string): boolean {
  const s = getHeroState(hid);
  if (s.nycklar < 1) return false;
  saveHeroState(hid, { ...s, nycklar: s.nycklar - 1 });
  return true;
}

/** Skattkistornas föremålsnivå följer hjältens nivå. */
export const skattIlvl = (level: number) => Math.min(13, 2 + Math.floor(level / 2));

/** Ger kistorna som hittades i en skattrunda (högst KEYS.chestsPerRun). */
export function giveSkattkistor(hid: string, n: number, source: string): Chest[] {
  const got: Chest[] = [];
  const s = getHeroState(hid);
  const count = Math.max(0, Math.min(KEYS.chestsPerRun, n));
  for (let i = 0; i < count; i++) got.push(addChest(hid, { ilvl: skattIlvl(s.level), minRarity: 1, kind: 'spel', source }));
  if (count) {
    const t = getHeroState(hid);
    saveHeroState(hid, { ...t, skatter: t.skatter + count });
  }
  return got;
}

/** Titlar från minispelen. Villkoren bygger på saker som aldrig minskar. */
export const SPEL_TITLAR: { title: string; ok: (s: ReturnType<typeof getHeroState>) => boolean; how: string }[] = [
  { title: 'Stormtämjaren', ok: (s) => s.storm.best >= 5, how: 'Klara steg 5 i Dimstormen' },
  { title: 'Djupdykaren', ok: (s) => s.grotta.best >= 10, how: 'Nå våning 10 i Grottdyket' },
  { title: 'Arenans hjälte', ok: (s) => s.arena.rank >= 6, how: 'Besegra sex motståndare i Arenan' },
  { title: 'Knutmästaren', ok: (s) => s.trassel.best >= 10, how: 'Lös pinnknut 10 på Trasselvinden' },
  { title: 'Repmästaren', ok: (s) => s.trassel.rep >= 10, how: 'Lös repknut 10 på Trasselvinden' },
  { title: 'Skattjägaren', ok: (s) => s.skatter >= 10, how: 'Hitta tio skattkistor på Spelön' },
];

/** Delar ut minispelstitlar som hjälten har förtjänat. Returnerar de nya. */
export function grantSpelTitlar(hid: string): string[] {
  const s = getHeroState(hid);
  const fresh = SPEL_TITLAR.filter((t) => t.ok(s) && !s.titles.includes(t.title)).map((t) => t.title);
  if (fresh.length) saveHeroState(hid, { ...s, titles: [...s.titles, ...fresh], title: fresh.at(-1)! });
  return fresh;
}
