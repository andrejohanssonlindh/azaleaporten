import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHero, getHeroState, type NewHero } from '../src/platform/profiles';
import {
  advance, currentQuestion, finishRun, getArea, getPlay, nodeStatus, nextOpenNode, recordAnswer, runOver, savePlay, startRun, findNode,
} from '../src/platform/rpg/progress';
import { needXP, TIRED_AFTER_MS } from '../src/platform/rpg/balance';
import { TIDSTORNET } from '../src/games/klocka/content';
import { klocka } from '../src/games/klocka';
import { alreadyImported, importV01, parseV01Paste } from '../src/platform/legacy/klockaV01';
import type { PathNode } from '../src/platform/rpg/types';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); });

const hero = (patch: Partial<NewHero> = {}) => createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4, ...patch }).id;
const node = (id: string) => findNode(TIDSTORNET, id) as PathNode;

/** Spelar en hel runda med givna svar (true = rätt) och given svarstid. */
function play(hid: string, n: PathNode, answers: boolean[], ms = 3000) {
  let run = startRun(hid, TIDSTORNET, n);
  for (const c of answers) {
    run = recordAnswer(hid, run, n, { correct: c, ms, hint: false }, 'ma.tid.test');
    if (runOver(run)) break;
    run = advance(hid, run);
  }
  expect(runOver(run)).toBe(true);
  return finishRun(hid, TIDSTORNET, run);
}

describe('rundor och stjärnor', () => {
  it('en runda är exakt tio frågor', () => {
    const hid = hero();
    let run = startRun(hid, TIDSTORNET, node('minutvisaren'));
    for (let i = 0; i < 9; i++) { run = recordAnswer(hid, run, node('minutvisaren'), { correct: true, ms: 1000, hint: false }, 's'); run = advance(hid, run); }
    expect(runOver(run)).toBe(false);
    run = recordAnswer(hid, run, node('minutvisaren'), { correct: true, ms: 1000, hint: false }, 's');
    expect(runOver(run)).toBe(true);
  });

  it('8 rätt räcker inte – nästa bana förblir låst och en ny runda börjar om', () => {
    const hid = hero();
    const o = play(hid, node('minutvisaren'), [true, true, true, true, true, true, true, true, false, false]);
    expect(o.cleared).toBe(false);
    expect(nodeStatus(TIDSTORNET, getArea(hid, 'tidstornet'), 'forsta-orden')).toBe('locked');
    expect(getPlay(hid).run).toBeNull();
  });

  it('9 rätt = en stjärna, 10 rätt = två, 10 rätt snabbt = tre', () => {
    const hid = hero();
    expect(play(hid, node('minutvisaren'), [...Array(9).fill(true), false]).stars).toBe(1);
    expect(play(hid, node('minutvisaren'), Array(10).fill(true), 20_000).stars).toBe(2);
    const o = play(hid, node('minutvisaren'), Array(10).fill(true), 2_000);
    expect(o.stars).toBe(3);
    expect(o.newStars).toBe(1);
    expect(getArea(hid, 'tidstornet').stages.minutvisaren.stars).toBe(3);
    expect(nodeStatus(TIDSTORNET, getArea(hid, 'tidstornet'), 'forsta-orden')).toBe('open');
  });

  it('kastanjer bara vid rundans slut, och mest första gången', () => {
    const hid = hero();
    let run = startRun(hid, TIDSTORNET, node('minutvisaren'));
    run = recordAnswer(hid, run, node('minutvisaren'), { correct: true, ms: 1000, hint: false }, 's');
    expect(getHeroState(hid).kastanjer).toBe(0);
    const first = play(hid, node('forsta-orden'), Array(10).fill(true), 20_000);
    const again = play(hid, node('forsta-orden'), Array(10).fill(true), 20_000);
    expect(first.kastanjer).toBeGreaterThan(again.kastanjer);
    expect(first.firstClear).toBe(true);
    expect(again.firstClear).toBe(false);
  });

  it('samma seed och index ger samma fråga (omladdning byter inte fråga)', () => {
    const hid = hero();
    const run = startRun(hid, TIDSTORNET, node('femminutare'));
    expect(currentQuestion(run, node('femminutare'), klocka)).toEqual(currentQuestion({ ...run }, node('femminutare'), klocka));
  });

  it('trött hjälte får inga kastanjer men XP räknas', () => {
    const hid = hero();
    savePlay(hid, { ...getPlay(hid), activeMs: TIRED_AFTER_MS });
    const o = play(hid, node('minutvisaren'), Array(10).fill(true), 20_000);
    expect(o.kastanjer).toBe(0);
    expect(o.tired).toBe(true);
    expect(o.xp).toBeGreaterThan(0);
  });

  it('trollkarlen får mer XP', () => {
    const a = play(hero(), node('minutvisaren'), Array(10).fill(true), 20_000).xp;
    const b = play(hero({ heroClass: 'trollkarl' }), node('minutvisaren'), Array(10).fill(true), 20_000).xp;
    expect(b).toBeGreaterThan(a);
  });
});

describe('bossar', () => {
  it('8 träffar besegrar Halvsaurus: husdjur och titel', () => {
    const hid = hero();
    const o = play(hid, node('halvsaurus'), Array(8).fill(true));
    expect(o.bossWon).toBe(true);
    expect(o.gained.pet).toBe('Lilla Halvsaurus');
    expect(getHeroState(hid).pets).toContain('tidstornet:halvsaurus');
    expect(getHeroState(hid).title).toBe('Halvtämjaren');
  });

  it('tre fel och bossen vinner; riddaren tål ett fel till', () => {
    const o = play(hero(), node('halvsaurus'), [false, false, false]);
    expect(o.bossWon).toBe(false);
    const hid = hero({ heroClass: 'riddare' });
    let run = startRun(hid, TIDSTORNET, node('halvsaurus'));
    expect(run.hearts).toBe(4);
    for (let i = 0; i < 3; i++) { run = recordAnswer(hid, run, node('halvsaurus'), { correct: false, ms: 1000, hint: false }, 's'); run = advance(hid, run); }
    expect(runOver(run)).toBe(false);
  });

  it('bossen riktar varannan fråga mot sin fälla', () => {
    const hid = hero();
    let run = startRun(hid, TIDSTORNET, node('halvsaurus'));
    const q0 = currentQuestion(run, node('halvsaurus'), klocka) as { s?: { halv: boolean }; mode: string };
    if (q0.mode === 'words') expect(q0.s!.halv).toBe(true);
    run = advance(hid, run);
    expect(run.index).toBe(1);
  });

  it('en hel genomspelning låser upp allt i ordning', () => {
    const hid = hero();
    let n = nextOpenNode(TIDSTORNET, getArea(hid, 'tidstornet'));
    let steps = 0;
    while (n && steps++ < 30) {
      const o = n.type === 'boss' ? play(hid, n, Array(n.hp).fill(true)) : play(hid, n, Array(10).fill(true), 1000);
      expect(o.cleared || o.bossWon).toBe(true);
      n = nextOpenNode(TIDSTORNET, getArea(hid, 'tidstornet'));
    }
    expect(n).toBeUndefined();
    expect(getHeroState(hid).mentors).toContain('tidstornet:tidens-vaktare');
    expect(getHeroState(hid).level).toBeGreaterThan(1);
  });
});

describe('import från Klockövning v0.1', () => {
  const paste = readFileSync(new URL('./fixtures/storage/legacy-klocka-v01.json', import.meta.url), 'utf8');

  it('läser konsolsnuttens format', () => {
    const f = parseV01Paste(paste)!;
    expect(Object.keys(f)).toEqual(['Hjälte1']);
    expect(parseV01Paste('inte json')).toBeNull();
    expect(parseV01Paste('{"annat":1}')).toBeNull();
  });

  it('flyttar banor, stjärnor och nivå – och ger en Pionjärkista i stället för alla mynt', () => {
    const hid = hero();
    const r = importV01(hid, 'Hjälte1', parseV01Paste(paste)!['Hjälte1']);
    const area = getArea(hid, 'tidstornet');
    expect(r.stages).toBe(4);
    expect(area.stages.minutvisaren).toMatchObject({ cleared: true, stars: 3 });
    expect(area.stages['las-klockan'].cleared).toBe(true);
    expect(area.stages.femminutare).toBeUndefined();
    const s = getHeroState(hid);
    expect(s.level).toBeGreaterThanOrEqual(6);
    expect(r.kastanjer).toBeLessThanOrEqual(60);
    expect(s.legacy.pioneerChest).toBe('pending');
    expect(s.titles).toContain('Pionjär');
    expect(s.achievements['klocka.s5']).toBeTruthy();
    expect(r.events).toBe(4);
    expect(alreadyImported(hid, 'Hjälte1')).toBe(true);
  });

  it('bossar hjälten aldrig mött blir nästa steg, utan att låsa importerade banor', () => {
    const hid = hero();
    importV01(hid, 'Hjälte1', parseV01Paste(paste)!['Hjälte1']);
    const area = getArea(hid, 'tidstornet');
    // Kvarten kom till efter v0.1 och står före Halvsaurus; importerade banor efter den förblir klara.
    expect(nextOpenNode(TIDSTORNET, area)?.id).toBe('kvarten');
    expect(nodeStatus(TIDSTORNET, area, 'halvsaurus')).toBe('locked');
    expect(nodeStatus(TIDSTORNET, area, 'las-klockan')).toBe('done');
    expect(nodeStatus(TIDSTORNET, area, 'tjugo')).toBe('open');
  });

  it('XP-kurvan: ingen tappar nivå', () => {
    let total = 40;
    for (let l = 1; l < 6; l++) total += 50 + 25 * l;
    let lvl = 1, left = Math.round(total * 1.2);
    while (left >= needXP(lvl)) { left -= needXP(lvl); lvl++; }
    expect(lvl).toBeGreaterThanOrEqual(6);
  });
});
