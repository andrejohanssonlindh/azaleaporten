import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { mentions } from '../src/engines/ord/check';
import { berattelseGame } from '../src/games/berattelse';
import { ERR, items, makeQ } from '../src/games/berattelse/logic';
import { TEXTER } from '../src/games/berattelse/texter';
import { BERATTELSEBIBLIOTEKET } from '../src/games/berattelse/content';
import { ORDSKOGENS_HJARTA } from '../src/games/ordskogen';
import { loadAllGames, PLAYABLE } from '../src/content/areas';
import { REGIONS } from '../src/content/world';
import { allNodes } from '../src/platform/rpg/types';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Berättelsebiblioteket och Ordskogens regionboss.

const ord = (s: string) => s.split(/[^\p{L}]+/u).filter(Boolean).length;

describe('bibliotekets texter', () => {
  it('rätt längd per band, och varje text har alla sorters frågor', () => {
    for (const t of TEXTER) {
      const n = ord(t.text);
      if (t.band === 1) expect(n, `${t.titel}: ${n} ord`).toBeLessThanOrEqual(90);
      else if (t.typ !== 'dikt') expect(n, `${t.titel}: ${n} ord`).toBeGreaterThanOrEqual(85);
      expect(new Set(t.fragor.map((f) => f.typ)), t.titel).toEqual(new Set(['raden', 'mellan', 'ord', 'huvud']));
    }
    expect(TEXTER.filter((t) => t.band === 1).length).toBeGreaterThanOrEqual(10);
  });

  it('varje fråga har två olika fel med kända felkoder, och svaret står inte i frågan', () => {
    for (const t of TEXTER) for (const f of t.fragor) {
      expect(f.fel.length, f.q).toBe(2);
      expect(new Set([f.svar, ...f.fel.map(([x]) => x)].map((x) => x.toLocaleLowerCase('sv'))).size, f.q).toBe(3);
      for (const [, tag] of f.fel) expect(ERR[tag], `${f.q}: ${tag}`).toBeTruthy();
      expect(f.q.toLocaleLowerCase('sv').includes(f.svar.toLocaleLowerCase('sv')), f.q).toBe(false);
    }
  });

  it('ordfrågorna handlar om ett ord som står i texten', () => {
    for (const t of TEXTER) for (const f of t.fragor.filter((x) => x.typ === 'ord')) {
      const w = /"([^"]+)"/.exec(f.q)![1].split(' ').at(-1)!;
      expect(mentions(t.text, w) || t.text.toLocaleLowerCase('sv').includes(w.toLocaleLowerCase('sv')), `${t.titel}: ${w}`).toBe(true);
    }
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => checkArea(BERATTELSEBIBLIOTEKET, berattelseGame));
  it('bossarnas fällor', () => checkTraps(BERATTELSEBIBLIOTEKET, berattelseGame));
  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(BERATTELSEBIBLIOTEKET)) if (n.type === 'stage') expect(items(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
    checkDecks(BERATTELSEBIBLIOTEKET, berattelseGame, (q) => `${q.text}/${q.row}`);
  });

  it('i en runda kommer frågorna om samma text efter varandra', () => {
    const qs = Array.from({ length: 10 }, (_, i) => makeQ({ mode: 'blandat', level: 0 }, rngFrom(i), { seed: 7, index: i }));
    const byte = qs.filter((q, i) => i > 0 && q.text !== qs[i - 1].text).length;
    expect(byte).toBeLessThanOrEqual(3);
  });

  it('nivå 0 använder bara de kortare texterna', () => {
    for (let seed = 0; seed < 200; seed++) expect(TEXTER[makeQ({ mode: 'blandat', level: 0 }, rngFrom(seed)).text].band).toBe(1);
  });
});

describe('Ordskogens hjärta', () => {
  it('är en regionboss som blandar alla fem områdena och öppnar efter tre Mästare', async () => {
    expect(ORDSKOGENS_HJARTA.region).toEqual({ id: 'ordskogen', mastareNeeded: 3 });
    const areas = REGIONS.find((r) => r.id === 'ordskogen')!.areas;
    expect(areas.every((a) => a.status === 'open' && PLAYABLE[a.id])).toBe(true);
    const boss = allNodes(ORDSKOGENS_HJARTA)[0];
    expect(boss.type === 'boss' && new Set(boss.pool.map((s) => s.mode.split('/')[0]))).toEqual(new Set(areas.map((a) => a.id)));
    const games = await loadAllGames();
    const g = games.ordskogen;
    if (boss.type !== 'boss') throw new Error('ingen boss');
    for (const spec of boss.pool) for (let seed = 0; seed < 20; seed++) {
      const q = g.makeQuestion(spec, rngFrom(seed));
      expect(g.areaOf!(q)).toBe(spec.mode.split('/')[0]);
      expect(g.skillOf(q)).toMatch(/^sv\./);
    }
  });
});
