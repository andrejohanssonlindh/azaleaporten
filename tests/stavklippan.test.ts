import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { diagnoseAny } from '../src/engines/ord/check';
import { stavklippanGame } from '../src/games/stavklippan';
import { ENTRIES, makeQ, pool, variants } from '../src/games/stavklippan/logic';
import { RULE_IDS, RULES } from '../src/games/stavklippan/ord';
import { STAVKLIPPAN } from '../src/games/stavklippan/content';
import { allNodes } from '../src/platform/rpg/types';
import { checkArea, checkDecks, checkTraps } from './ordcheck';

// Stavklippan: engelsk stavning. Felstavningarna är typiska, diagnosen känner igen dem, och inget avslöjar svaret.

describe('Stavklippans ord', () => {
  it('orden är unika, och varje ord har minst två typiska felstavningar', () => {
    const all = ENTRIES.map((e) => e.en);
    expect(new Set(all).size).toBe(all.length);
    for (const e of ENTRIES) {
      const v = variants(e);
      expect(v.length, e.en).toBeGreaterThanOrEqual(2);
      expect(v.some((a) => a.text === e.en), e.en).toBe(false);
      expect(e.en, e.en).toMatch(/^[a-z]+$/);
    }
    for (const r of RULE_IDS) {
      expect(RULES[r].words.filter((w) => w[3] === 1).length, r).toBeGreaterThanOrEqual(10);
      const sv = RULES[r].words.map((w) => w[1]);
      expect(new Set(sv).size, r).toBe(sv.length);
    }
  });

  it('regelns typiska fel finns för orden', () => {
    const some = (rule: string, tag: string) => ENTRIES.filter((e) => e.rule === rule).some((e) => variants(e).some((a) => a.err === tag));
    expect(some('ee-ea', 'som-svenska')).toBe(true);
    expect(some('ee-ea', 'ee-ea')).toBe(true);
    expect(some('lang-a', 'magiskt-e')).toBe(true);
    expect(some('tyst', 'tyst-bokstav')).toBe(true);
    expect(some('plural', 'plural')).toBe(true);
    expect(some('dubbel', 'enkel-bokstav')).toBe(true);
    expect(variants(ENTRIES.find((e) => e.en === 'yes')!).map((a) => a.text)).toContain('jes');
    expect(variants(ENTRIES.find((e) => e.en === 'like')!).map((a) => a.text)).toContain('lajk');
    expect(variants(ENTRIES.find((e) => e.en === 'ship')!).map((a) => a.text)).toContain('sjip');
    expect(variants(ENTRIES.find((e) => e.en === 'babies')!).map((a) => a.text)).toContain('babys');
  });
});

describe('frågorna', () => {
  it('ett rätt svar, unika alternativ, och förklaringar som inte avslöjar svaret', () => checkArea(STAVKLIPPAN, stavklippanGame));

  it('diktat: det barnet skriver diagnostiseras', () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = makeQ({ mode: 'blandat', level: 2 }, rngFrom(seed));
      expect(q.kind).toBe('skriv');
      expect(q.lang).toBe('en-GB');
      const e = ENTRIES.find((x) => x.en === q.answer)!;
      for (const v of variants(e)) expect(diagnoseAny(stavklippanGame, q, v.text), `${q.answer} ${v.text}`).toBe(v.err);
      expect(diagnoseAny(stavklippanGame, q, q.answer.toUpperCase())).toBe('annat');
    }
  });

  it('hitta felet: fyra ord, exakt ett felstavat, och det är inte ett riktigt ord', () => {
    const real = new Set(ENTRIES.map((e) => e.en));
    for (let seed = 0; seed < 200; seed++) {
      const q = makeQ({ mode: 'blandat', level: 3 }, rngFrom(seed));
      expect(q.kind).toBe('markera');
      expect(q.tokens!.length).toBe(4);
      expect(q.tokens!.filter((t) => !real.has(t)).length, q.tokens!.join(' ')).toBe(1);
      expect(real.has(q.tokens![q.targets![0]])).toBe(false);
    }
  });

  it('bossarnas fällor finns alltid bland alternativen', () => checkTraps(STAVKLIPPAN, stavklippanGame));

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(STAVKLIPPAN)) if (n.type === 'stage') expect(pool(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
    checkDecks(STAVKLIPPAN, stavklippanGame, (q) => `${q.rule}/${q.row}`);
  });
});
