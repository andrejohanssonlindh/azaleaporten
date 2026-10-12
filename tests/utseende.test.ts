import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, markTip, saveHeroState, type NewHero } from '../src/platform/profiles';
import { equip, getInv, heroStats, salvageCommon, saveInv, statDiff, statExplain } from '../src/platform/rpg/inventory';
import { STATS, type Item } from '../src/platform/rpg/items';
import { advance, bossHearts, bossPreview, findNode, finishRun, getPlay, recordAnswer, runOver, savePlay, startRun, starsFor } from '../src/platform/rpg/progress';
import { MOB } from '../src/platform/rpg/balance';
import { buyCosmetic, COSMETICS, cosmetic, getWardrobe, owns, takeOff, wear as wearLook, wornLook } from '../src/platform/rpg/wardrobe';
import { ARENA, buyToken, payToken } from '../src/platform/rpg/arena';
import { STIGMONSTER } from '../src/content/monsters';
import { TIDSTORNET } from '../src/games/klocka/content';
import type { BossDef, PathNode } from '../src/platform/rpg/types';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = (p: Partial<NewHero> = {}) => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'trollkarl', grade: 4, ...p }).id;
const node = (id: string) => findNode(TIDSTORNET, id) as PathNode;
const rich = (hid: string, kastanjer = 500) => saveHeroState(hid, { ...getHeroState(hid), kastanjer });

function item(slot: Item['slot'], stats: Item['stats'], rarity: Item['rarity'] = 0, id = `t-${slot}-${Math.random()}`): Item {
  return { id, base: 'svard', slot, name: 'Test', icon: '🗡️', rarity, ilvl: 1, stats, plus: 0, foundAt: '' };
}
function give(hid: string, ...items: Item[]) {
  const inv = getInv(hid);
  saveInv(hid, { ...inv, items: [...inv.items, ...items] });
}

/** Spelar en vanlig runda och returnerar sista rundtillståndet och resultatet. */
function play(hid: string, answers: boolean[], ms = 3000) {
  const n = node('minutvisaren');
  let run = startRun(hid, TIDSTORNET, n);
  let last = run;
  for (const c of answers) {
    run = recordAnswer(hid, run, n, { correct: c, ms, hint: false }, 's');
    last = run;
    if (runOver(run)) break;
    run = advance(hid, run);
  }
  return { last, o: finishRun(hid, TIDSTORNET, run) };
}

describe('nya fält i hjältens post', () => {
  it('äldre sparningar får standardvärden, och en introduktion visas bara en gång', () => {
    const hid = hero();
    const s = getHeroState(hid);
    expect(s.tips).toEqual([]);
    expect(s.polletter).toBe(0);
    expect(s.arena).toEqual({ rank: 0, wins: 0 });
    markTip(hid, 'utrustning');
    markTip(hid, 'utrustning');
    expect(getHeroState(hid).tips).toEqual(['utrustning']);
  });
});

describe('packningen i Azaleagården', () => {
  it('smält alla gråa: bara vanliga, inte utrustade och inte unika', () => {
    const hid = hero();
    const worn = item('vapen', { kraft: 1 }, 0, 'worn');
    give(hid, item('huvud', { tur: 1 }), item('kropp', { skydd: 1 }), item('amulett', { tur: 2 }, 2), worn, { ...item('skold', { visdom: 1 }), unique: true });
    equip(hid, 'worn');
    const blad = getHeroState(hid).blad;
    expect(salvageCommon(hid)).toEqual({ n: 2, blad: 2 });
    expect(getHeroState(hid).blad).toBe(blad + 2);
    expect(getInv(hid).items.map((i) => i.rarity)).toEqual([2, 0, 0]);
    expect(salvageCommon(hid)).toEqual({ n: 0, blad: 0 });
  });

  it('jämförelsen visar skillnaden mot det som sitter på platsen', () => {
    expect(statDiff(item('vapen', { kraft: 3, tur: 1 }), item('vapen', { kraft: 1, skydd: 2 }))).toEqual({ kraft: 2, skydd: -2, tur: 1 });
    expect(statDiff(item('vapen', { kraft: 3 }), undefined)).toEqual({ kraft: 3 });
  });

  it('varje egenskap har en förklaring med hjältens egna siffror', () => {
    const zero = Object.fromEntries(STATS.map((s) => [s.id, 0])) as ReturnType<typeof heroStats>;
    for (const s of STATS) expect(statExplain(s.id, zero, false).length).toBeGreaterThan(10);
    expect(statExplain('kraft', { ...zero, kraft: 4 }, false)).toContain('11 skada');
    expect(statExplain('skydd', { ...zero, skydd: 6 }, false)).toContain('+1 hjärta');
  });
});

describe('Garderoben och Skräddaren', () => {
  it('id:n är unika', () => {
    expect(new Set(COSMETICS.map((c) => c.id)).size).toBe(COSMETICS.length);
    // Varje plagg går att få: köpa, låsa upp eller hitta i en skattkista.
    for (const c of COSMETICS) expect(c.cost !== undefined || c.unlock !== undefined || c.kista === true || c.uppdrag === true).toBe(true);
  });

  it('köpa kostar kastanjer, tar på saken, och går inte två gånger', () => {
    const hid = hero();
    expect(buyCosmetic(hid, 'hatt.party')).toBe(false); // inga kastanjer
    rich(hid, 100);
    expect(buyCosmetic(hid, 'hatt.party')).toBe(true);
    expect(getHeroState(hid).kastanjer).toBe(60);
    expect(wornLook(hid).hatt?.id).toBe('hatt.party');
    expect(buyCosmetic(hid, 'hatt.party')).toBe(false);
    expect(getHeroState(hid).kastanjer).toBe(60);
    takeOff(hid, 'hatt');
    expect(wornLook(hid).hatt).toBeUndefined();
    expect(wearLook(hid, 'hatt.party')).toBe(true);
  });

  it('belöningar kan inte köpas, men låses upp och kan då bäras', () => {
    const hid = hero();
    rich(hid);
    const reward = cosmetic('mantel.guld')!;
    expect(buyCosmetic(hid, reward.id)).toBe(false);
    expect(wearLook(hid, reward.id)).toBe(false);
    expect(owns(hid, reward)).toBe(false);
    saveHeroState(hid, { ...getHeroState(hid), mentors: ['tidstornet:tidens-vaktare'] });
    expect(owns(hid, reward)).toBe(true);
    expect(wearLook(hid, reward.id)).toBe(true);
    expect(wornLook(hid).mantel?.id).toBe('mantel.guld');
    expect(getHeroState(hid).kastanjer).toBe(500);
  });

  it('okända eller inte ägda saker i posten bärs inte', () => {
    const hid = hero();
    const w = getWardrobe(hid);
    expect(w.owned).toEqual([]);
    expect(wearLook(hid, 'finns-inte')).toBe(false);
    expect(wornLook(hid)).toEqual({});
  });
});

describe('stigmonster i vanliga banor', () => {
  it('rätta svar slår till monstret; besegrade ger blad – men stjärnorna räknas som vanligt', () => {
    const hid = hero();
    const { last, o } = play(hid, Array(10).fill(true), 20_000);
    expect(last.mob!.beaten).toBe(Math.floor((10 * 10) / MOB.hp));
    expect(o.mobs).toEqual({ beaten: last.mob!.beaten, blad: last.mob!.beaten * MOB.blad });
    expect(getHeroState(hid).blad).toBe(o.mobs!.blad);
    expect(o.stars).toBe(starsFor(10, 10, 20_000, false, (node('minutvisaren') as { thrMs: number }).thrMs));
    expect(STIGMONSTER.length).toBeGreaterThan(5);
  });

  it('kraft fäller fler monster, men ändrar inte rundans längd eller stjärnor', () => {
    const plain = hero(), strong = hero();
    give(strong, item('vapen', { kraft: 16 }, 4, 'kraft'));
    equip(strong, 'kraft');
    const a = play(plain, [...Array(9).fill(true), false], 20_000);
    const b = play(strong, [...Array(9).fill(true), false], 20_000);
    expect(b.last.mob!.beaten).toBeGreaterThan(a.last.mob!.beaten);
    expect(b.o.total).toBe(10);
    expect(b.o.stars).toBe(a.o.stars);
  });

  it('fel svar skadar inte monstret, och en trött hjälte får inga blad', () => {
    const hid = hero();
    savePlay(hid, { ...getPlay(hid), activeMs: 31 * 60_000 });
    const { last, o } = play(hid, [false, ...Array(9).fill(true)], 20_000);
    expect(last.mob!.beaten).toBe(1);
    expect(o.mobs!.blad).toBe(0);
    expect(getHeroState(hid).blad).toBe(0);
  });

  it('samma svar efter omladdning ger samma slag (fullträffen följer seeden)', () => {
    const hid = hero();
    give(hid, item('amulett', { tur: 12 }, 4, 'tur'));
    equip(hid, 'tur');
    const n = node('minutvisaren');
    const run = startRun(hid, TIDSTORNET, n);
    const a = recordAnswer(hid, run, n, { correct: true, ms: 9000, hint: false }, 's');
    const again = recordAnswer(hid, { ...run, results: [] }, n, { correct: true, ms: 9000, hint: false }, 's');
    expect(again.mob!.lastHit).toEqual(a.mob!.lastHit);
  });

  it('övning och bossar har inga stigmonster', () => {
    const hid = hero();
    expect(startRun(hid, TIDSTORNET, node('minutvisaren'), 'practice').mob).toBeUndefined();
    expect(startRun(hid, TIDSTORNET, node('halvsaurus')).mob).toBeUndefined();
  });
});

describe('bossintrot visar vad utrustningen gör', () => {
  it('hjärtan och skada stämmer med striden', () => {
    const hid = hero({ heroClass: 'riddare' });
    give(hid, item('kropp', { skydd: 6 }, 2, 'sk'), item('vapen', { kraft: 8 }, 2, 'kr'));
    equip(hid, 'sk'); equip(hid, 'kr');
    const h = bossHearts(hid, false);
    expect(h).toMatchObject({ base: 3, klass: 1, skydd: 1, potion: 0, total: 5 });
    const b = node('halvsaurus') as BossDef;
    const pv = bossPreview(hid, b);
    expect(pv.dmg).toBe(12);
    expect(startRun(hid, TIDSTORNET, b)).toMatchObject({ hearts: 5, maxHp: pv.maxHp });
  });
});

describe('Arenan', () => {
  it('polletter kostar kastanjer och har ett tak', () => {
    const hid = hero();
    expect(buyToken(hid)).toBe(false);
    rich(hid, ARENA.tokenCost * 20);
    for (let i = 0; i < ARENA.maxTokens; i++) expect(buyToken(hid)).toBe(true);
    expect(buyToken(hid)).toBe(false);
    expect(getHeroState(hid).polletter).toBe(ARENA.maxTokens);
    expect(payToken(hid)).toBe(true);
    expect(getHeroState(hid).polletter).toBe(ARENA.maxTokens - 1);
  });
});
