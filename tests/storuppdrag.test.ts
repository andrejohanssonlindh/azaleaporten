import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, saveHeroState } from '../src/platform/profiles';
import { getInv } from '../src/platform/rpg/inventory';
import { owns, cosmetic } from '../src/platform/rpg/wardrobe';
import { CHAINS, chainState, claimChain, getBigQuests, noteBig, skipArende, WEEK_KINDS, type BigReport } from '../src/platform/learning/storuppdrag';
import { ARENDEN } from '../src/content/arenden';
import { PLAYABLE } from '../src/content/areas';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });
const hero = (grade = 3) => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'riddare', grade }).id;
const DAY = '2026-10-12'; // en måndag
const run = (p: Partial<BigReport> = {}): BigReport => ({ kind: 'stage', areaId: 'tidstornet', nodeId: 'minutvisaren', cleared: true, won: false, progressed: false, correct: 10, total: 10, mobs: 3, ...p });

describe('veckans utmaningar', () => {
  it('tre olika per vecka, samma hela veckan, nya nästa vecka', () => {
    const hid = hero();
    const a = getBigQuests(hid, DAY).weekly.map((q) => q.kind);
    expect(new Set(a).size).toBe(3);
    expect(getBigQuests(hid, '2026-10-18').weekly.map((q) => q.kind)).toEqual(a);
    const b = getBigQuests(hid, '2026-10-19');
    expect(b.week).toBe('2026-10-19');
    expect(b.weekly.every((q) => q.n === 0)).toBe(true);
  });

  it('räknas upp av rundor och ger kista, kastanjer och till sist en spelnyckel', () => {
    const hid = hero();
    getBigQuests(hid, DAY);
    let bonus = false;
    for (let i = 0; i < 40 && !bonus; i++) {
      const news = noteBig(hid, run({ kind: i % 3 === 0 ? 'review' : 'stage', won: i % 5 === 0, dayDone: i % 2 === 0 }), DAY);
      for (const q of news.weekly) expect(q.n).toBe(WEEK_KINDS[q.kind].goal);
      bonus = news.weekBonus;
      if (i % 4 === 0) noteBig(hid, run({ kind: 'practice' }), DAY);
    }
    expect(bonus).toBe(true);
    expect(getHeroState(hid).nycklar).toBe(1);
    expect(getHeroState(hid).kastanjer).toBeGreaterThanOrEqual(45);
    expect(getInv(hid).chests.filter((c) => c.kind === 'vecka')).toHaveLength(3);
  });
});

describe('äventyrsuppdrag', () => {
  it('ett steg i taget, bara när målet är nått; sista steget ger titel och plagg', () => {
    const hid = hero();
    const tamj = CHAINS.find((c) => c.id === 'tamj')!;
    expect(claimChain(hid, 'tamj')).toBeNull();
    saveHeroState(hid, { ...getHeroState(hid), pets: Array.from({ length: 10 }, (_, i) => `a:${i}`) });
    for (let i = 0; i < tamj.goals.length; i++) expect(claimChain(hid, 'tamj')).not.toBeNull();
    expect(claimChain(hid, 'tamj')).toBeNull();
    expect(chainState(hid, tamj).done).toBe(true);
    const s = getHeroState(hid);
    expect(s.titles).toContain('Monsterviskaren');
    expect(owns(hid, cosmetic('mantel.tamjare')!)).toBe(true);
  });
});

describe('byns ärenden', () => {
  it('alla ärenden pekar på spelbara områden och har unika id', () => {
    expect(new Set(ARENDEN.map((a) => a.id)).size).toBe(ARENDEN.length);
    for (const a of ARENDEN) expect(PLAYABLE[a.areaId], a.id).toBeTruthy();
  });

  it('ett ärende som passar årskursen; klara rundor där löser det och nästa kommer', () => {
    const hid = hero(1);
    const st = getBigQuests(hid, DAY);
    const a = ARENDEN.find((x) => x.id === st.errand.id)!;
    expect(a).toBeTruthy();
    for (let i = 0; i < a.n - 1; i++) expect(noteBig(hid, run({ areaId: a.areaId }), DAY).errandDone).toBeNull();
    noteBig(hid, run({ areaId: 'annat', cleared: true }), DAY);
    expect(noteBig(hid, run({ areaId: a.areaId, cleared: false }), DAY).errandDone).toBeNull();
    expect(noteBig(hid, run({ areaId: a.areaId }), DAY).errandDone?.id).toBe(a.id);
    const next = getBigQuests(hid, DAY);
    expect(next.errandsDone).toContain(a.id);
    expect(next.errand.id).not.toBe(a.id);
    expect(getInv(hid).chests.some((c) => c.kind === 'uppdrag')).toBe(true);
  });

  it('man kan byta ärende utan att det räknas som klart', () => {
    const hid = hero();
    const first = getBigQuests(hid, DAY).errand.id;
    const other = skipArende(hid);
    expect(other?.id).not.toBe(first);
    expect(getBigQuests(hid, DAY).errandsDone).not.toContain(first);
  });
});
