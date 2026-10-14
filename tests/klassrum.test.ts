import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState } from '../src/platform/profiles';
import { getArea } from '../src/platform/rpg/progress';
import { allNodes } from '../src/platform/rpg/types';
import { LEKTION } from '../src/platform/rpg/balance';
import { finishLesson, lessonDone, lessonForNode, lessonForSkill, nudgeFor, recentNudge } from '../src/platform/learning/lektioner';
import { logEvents } from '../src/platform/learning/events';
import { loadAllGames, PLAYABLE } from '../src/content/areas';
import { rngFrom } from '../src/platform/rng';
import { freshStorage } from './helpers';
import { kv } from '../src/platform/storage/kv';
import { _resetRecordState } from '../src/platform/storage/record';
import { skillLabel } from '../src/content/skills';

// Klassrummet: lektioner bredvid stigen och när de föreslås.

const GAMES = await loadAllGames();
beforeEach(() => { freshStorage(); });

const answers = (wrong: number, total: number) => Array.from({ length: total }, (_, i) => ({ correct: i >= wrong }));

describe('när en lektion föreslås', () => {
  it('mild vid fler än 20 % fel (minst två), stark vid hälften (minst tre)', () => {
    expect(nudgeFor([])).toBe('none');
    expect(nudgeFor(answers(1, 1))).toBe('none'); // ett enda fel är inget mönster
    expect(nudgeFor(answers(2, 10))).toBe('none'); // precis 20 %
    expect(nudgeFor(answers(2, 9))).toBe('mild');
    expect(nudgeFor(answers(2, 2))).toBe('mild');
    expect(nudgeFor(answers(3, 10))).toBe('mild');
    expect(nudgeFor(answers(4, 10))).toBe('mild');
    expect(nudgeFor(answers(5, 10))).toBe('stark');
    expect(nudgeFor(answers(3, 3))).toBe('stark');
  });

  it('på stigen räknas de senaste svaren på lektionens banor', () => {
    const hid = createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4 }).id;
    const def = PLAYABLE.tabellgruvan.def;
    const l = lessonForNode(def, 'dela-lika')!;
    const ev = (n: string, c: boolean) => ({ t: new Date().toISOString(), a: 'tabellgruvan', n, k: 'ma.div.2', c, ms: 1000 });
    expect(recentNudge(hid, 'tabellgruvan', l)).toBe('none');
    logEvents(hid, [ev('dela-lika', false), ev('dela-lika', false), ev('tvaan-femman-tian', false), ev('dela-lika', true)]);
    expect(recentNudge(hid, 'tabellgruvan', l)).toBe('mild'); // 2 fel av 3 på lektionens banor
    // Gamla fel glöms när det har gått bra länge.
    logEvents(hid, Array.from({ length: LEKTION.window }, () => ev('dela-i-tre-och-fyra', true)));
    expect(recentNudge(hid, 'tabellgruvan', l)).toBe('none');
  });
});

describe('lektionerna', () => {
  const withLessons = Object.entries(PLAYABLE).filter(([, p]) => p.def.lessons?.length);

  it('finns i alla matteområden i Talbergen och Betongbukten', () => {
    for (const id of ['tidstornet', 'tiokompisbron', 'tabellgruvan', 'myntmarknaden', 'tallinjebron', 'brakbageriet', 'fluffy', 'svampen', 'oxie', 'sibbarp', 'bryggeriet', 'kroksback', 'stapelbaddsparken', 'kodstigen', 'loopverkstaden', 'buggjakten', 'fageltornet', 'skordemarknaden']) {
      expect(PLAYABLE[id].def.lessons?.length, id).toBeGreaterThan(0);
    }
  });

  for (const [areaId, pl] of withLessons) {
    describe(areaId, () => {
      const game = GAMES[areaId];
      const metas = pl.def.lessons!;
      const nodeIds = new Set(allNodes(pl.def).map((n) => n.id));

      it('har unika id:n, banor som finns och innehåll för varje lektion (och tvärtom)', () => {
        expect(new Set(metas.map((m) => m.id)).size).toBe(metas.length);
        for (const m of metas) {
          expect(m.nodes.length, m.id).toBeGreaterThan(0);
          for (const n of m.nodes) expect(nodeIds.has(n), `${m.id}: ${n}`).toBe(true);
          const body = game.lessons?.[m.id];
          expect(body, m.id).toBeDefined();
          expect(body!.pages.length, m.id).toBeGreaterThan(0);
          for (const p of body!.pages) expect(p.title && p.text, m.id).toBeTruthy();
        }
        // Lektioner i spelet som inget område visar (ett spel kan tjäna flera områden).
        const shown = new Set(Object.values(PLAYABLE).filter((p) => GAMES[p.def.areaId] === game).flatMap((p) => p.def.lessons?.map((l) => l.id) ?? []));
        for (const id of Object.keys(game.lessons ?? {})) expect(shown.has(id), `${areaId}: ${id} saknar LessonMeta`).toBe(true);
      });

      it('en bana hör till högst en lektion', () => {
        const all = metas.flatMap((m) => m.nodes);
        expect(new Set(all).size).toBe(all.length);
      });

      it('"Prova själv" ger riktiga frågor', () => {
        for (const m of metas) {
          for (const p of game.lessons![m.id].pages) {
            if (!p.prova) continue;
            for (let seed = 1; seed <= 25; seed++) {
              const q = game.makeQuestion(p.prova, rngFrom(seed), { seed, index: 0 });
              expect(game.skillOf(q), `${m.id}`).toMatch(/\./);
            }
          }
        }
      });

      it('färdigheterna är riktiga färdigheter (exakta id:n har ett namn hos Mästare Kastanj)', () => {
        for (const m of metas) {
          for (const sk of m.skills ?? []) {
            if (sk.endsWith('.')) continue;
            expect(skillLabel(sk), `${m.id}: ${sk}`).not.toBe('något du har övat på');
          }
        }
      });
    });
  }

  it('färdigheter matchas exakt (ma.mult.12 är inte noll-och-ett)', () => {
    const def = PLAYABLE.tabellgruvan.def;
    expect(lessonForSkill(def, 'ma.mult.12')?.id).not.toBe('noll-och-ett');
    expect(lessonForSkill(def, 'ma.mult.1')?.id).toBe('noll-och-ett');
    expect(lessonForSkill(def, 'ma.div.7')?.id).toBe('vad-ar-delat');
  });
});

describe('en genomgången lektion', () => {
  it('sparas och ger XP en enda gång, aldrig kastanjer', () => {
    const hid = createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4 }).id;
    const k0 = getHeroState(hid).kastanjer;
    expect(lessonDone(hid, 'tabellgruvan', 'vad-ar-delat')).toBe(false);
    const first = finishLesson(hid, 'tabellgruvan', 'vad-ar-delat');
    expect(first.first).toBe(true);
    expect(first.xp).toBeGreaterThanOrEqual(LEKTION.xp);
    expect(lessonDone(hid, 'tabellgruvan', 'vad-ar-delat')).toBe(true);
    expect(getArea(hid, 'tabellgruvan').xp).toBeGreaterThan(0);
    const again = finishLesson(hid, 'tabellgruvan', 'vad-ar-delat');
    expect(again).toEqual({ first: false, xp: 0, levelUps: 0 });
    expect(getHeroState(hid).kastanjer).toBe(k0);
  });

  it('gamla hjältar utan fältet får en tom samling', () => {
    const hid = createHero({ name: 'Hjälte1', animal: 'rav', color: 'azalea', heroClass: 'ranger', grade: 4 }).id;
    const key = `h:${hid}:hero`;
    const raw = { ...kv.get<Record<string, unknown>>(key)! };
    delete raw.lektioner;
    kv.set(key, raw);
    _resetRecordState();
    expect(getHeroState(hid).lektioner).toEqual({});
    expect(finishLesson(hid, 'tabellgruvan', 'vad-ar-ganger').first).toBe(true);
  });
});
