import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState } from '../src/platform/profiles';
import { getArea, saveArea } from '../src/platform/rpg/progress';
import { allNodes } from '../src/platform/rpg/types';
import { PLAYABLE } from '../src/content/areas';
import { allSteg, grownSince, markSeen, regionSteg } from '../src/platform/rpg/vaxt';
import { freshStorage } from './helpers';

beforeEach(() => freshStorage());

const hero = () => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4 }).id;

function clearFirstStage(hid: string, area: string) {
  const s = getArea(hid, area);
  const first = allNodes(PLAYABLE[area].def).find((n) => n.type === 'stage')!;
  saveArea(hid, area, { ...s, stages: { ...s.stages, [first.id]: { stars: 1, cleared: true, best: 9, runs: 1 } } });
}

function beat(hid: string, area: string, kind: 'mastare' | 'all') {
  const s = getArea(hid, area);
  const nodes = allNodes(PLAYABLE[area].def).filter((n) => kind === 'all' || (n.type === 'boss' && n.kind === 'mastare'));
  const stages = { ...s.stages }, bosses = { ...s.bosses };
  for (const n of nodes) {
    if (n.type === 'stage') stages[n.id] = { stars: 1, cleared: true, best: 9, runs: 1 };
    else bosses[n.id] = { defeated: true, attempts: 1, wins: 1 };
  }
  saveArea(hid, area, { ...s, stages, bosses });
}

describe('ön växer', () => {
  it('en ny hjälte har en orörd ö', () => {
    const hid = hero();
    expect(Object.values(allSteg(hid)).every((n) => n === 0)).toBe(true);
  });

  it('stegen följer banor, Mästare och regionbossen', () => {
    const hid = hero();
    clearFirstStage(hid, 'tidstornet');
    expect(regionSteg(hid, 'talbergen')).toBe(1);
    expect(regionSteg(hid, 'ordskogen')).toBe(0);
    beat(hid, 'tidstornet', 'mastare');
    expect(regionSteg(hid, 'talbergen')).toBe(2);
    beat(hid, 'tabellgruvan', 'mastare');
    beat(hid, 'brakbageriet', 'mastare');
    expect(regionSteg(hid, 'talbergen')).toBe(3);
    beat(hid, 'talbergen', 'all');
    expect(regionSteg(hid, 'talbergen')).toBe(4);
  });

  it('det som har vuxit firas bara en gång', () => {
    const hid = hero();
    clearFirstStage(hid, 'glosviken');
    const now = allSteg(hid);
    expect(grownSince(hid, now)).toEqual(['vasteron']);
    markSeen(hid, now);
    expect(grownSince(hid, allSteg(hid))).toEqual([]);
    expect(getHeroState(hid).oSteg.vasteron).toBe(1);
  });
});
