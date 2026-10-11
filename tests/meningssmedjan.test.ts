import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { core, diagnoseAny, explainAny, hintFor, isRight, mentions } from '../src/engines/ord/check';
import { meningGame } from '../src/games/mening';
import { anforingAlts, chunksOf, diagnoseOrder, gransTokens, items, kommaTokens, makeQ, NAMN, orders, punktVariants, type MQ } from '../src/games/mening/logic';
import { ANFORING, BYGG, KOMMA, PAR, PUNKT, SAMBAND, TECKEN } from '../src/games/mening/meningar';
import { MENINGSSMEDJAN } from '../src/games/mening/content';
import { skillLabel } from '../src/content/skills';
import { allNodes, type QuestionSpec } from '../src/platform/rpg/types';

// Meningssmedjan: meningarna är rätt skrivna, varje fråga har ett rätt svar, ordföljden känns igen,
// och förklaringarna avslöjar aldrig svaret.

const reveals = (text: string, answer: string) =>
  /\s/.test(answer) ? text.toLocaleLowerCase('sv').includes(answer.toLocaleLowerCase('sv')) : mentions(text, answer);

/** Stor bokstav mitt i en mening = ett namn. */
const namesOk = (s: string) => s.split(' ').slice(1).every((w) => w[0] === w[0].toLocaleLowerCase('sv') || NAMN.has(core(w).replace(/s$/, '')) || NAMN.has(core(w)));

describe('Meningssmedjans meningar', () => {
  it('rätt skrivna: stor bokstav först, punkt sist, stor bokstav mitt i bara på namn', () => {
    for (const s of [...PUNKT, ...PAR.flat()]) {
      expect(s[0], s).toBe(s[0].toLocaleUpperCase('sv'));
      expect(s, s).toMatch(/[.?!]$/);
      expect(namesOk(s), s).toBe(true);
    }
    for (const [t] of TECKEN) expect(t, t).not.toMatch(/[.?!]$/);
    expect(new Set(PUNKT).size).toBe(PUNKT.length);
  });

  it('varje punkt-mening har minst två fel, och inget fel är rätt skrivet', () => {
    for (const s of PUNKT) {
      const v = punktVariants(s);
      expect(v.length, s).toBeGreaterThanOrEqual(2);
      for (const a of v) expect(a.text, s).not.toBe(s);
      expect(new Set(v.map((a) => a.text)).size, s).toBe(v.length);
    }
  });

  it('två meningar ihop: ingen punkt, ingen stor bokstav i början av den andra, och rätt ord att trycka på', () => {
    PAR.forEach(([a], i) => {
      const { tokens, target } = gransTokens(i);
      expect(tokens.join(' '), a).not.toMatch(/[.?!]/);
      expect(tokens[target], a).toBe(core(a.split(' ').at(-1)!));
      expect(namesOk(tokens.join(' ')), tokens.join(' ')).toBe(true);
    });
  });

  it('bygg meningen: bitarnas ordning i innehållet är rätt, och bitarna är olika', () => {
    BYGG.forEach(([raw], i) => {
      const cs = chunksOf(i);
      expect(new Set(cs.map((c) => c.text)).size, raw).toBe(cs.length);
      expect(cs.every((c) => 'SVNMOAQ'.includes(c.role)), raw).toBe(true);
      expect(cs.filter((c) => c.role === 'V').length, raw).toBe(1);
      expect(orders(i), raw).toContain(cs.map((c) => c.text).join(' '));
    });
  });

  it('bygg meningen: ordföljder som är rätt och fel', () => {
    const at = (s: string) => BYGG.findIndex(([raw]) => raw === s);
    const bullar = at('A:i dag|V:ska|S:vi|M:baka|O:bullar');
    expect(orders(bullar).sort()).toEqual(['bullar ska vi baka i dag', 'i dag ska vi baka bullar', 'vi ska baka bullar i dag']);
    expect(diagnoseOrder(bullar, 'i dag vi ska baka bullar')).toBe('rak-ordfoljd');
    expect(diagnoseOrder(bullar, 'ska vi baka bullar i dag')).toBe('fraga-ordfoljd');
    expect(diagnoseOrder(bullar, 'vi baka ska bullar i dag')).toBe('ordfoljd');
    const bada = at('S:vi|V:badar|A:i sjön|A:på sommaren');
    expect(orders(bada).length).toBe(4);
    const fisk = at('S:jag|V:gillar|N:inte|O:fisk');
    expect(orders(fisk).sort()).toEqual(['fisk gillar jag inte', 'jag gillar inte fisk']);
    const katt = at('Q:vad|V:heter|S:din katt');
    expect(orders(katt)).toEqual(['vad heter din katt']);
    expect(diagnoseOrder(katt, 'vad din katt heter')).toBe('rak-ordfoljd');
    const leka = at('V:vill|S:du|M:leka|A:med mig');
    expect(diagnoseOrder(leka, 'du vill leka med mig')).toBe('fraga-ordfoljd');
  });

  it('sambandsord, komma och anföring', () => {
    for (const [s, right, wrong] of SAMBAND) {
      expect(s.split('___').length, s).toBe(2);
      expect(wrong.includes(right), s).toBe(false);
    }
    KOMMA.forEach(([s, type], i) => {
      expect(s.split(',').length, s).toBe(2);
      const { tokens, target, och } = kommaTokens(i);
      expect(target, s).toBeGreaterThanOrEqual(0);
      expect(tokens.join(' '), s).not.toContain(',');
      if (type === 'lista') expect(tokens[och! + 1], s).toBe('och');
      else expect(och, s).toBeUndefined();
    });
    ANFORING.forEach((_, i) => {
      for (const style of ['streck', 'citat'] as const) {
        const { right, wrong } = anforingAlts(i, style);
        expect(wrong.length, right).toBeGreaterThan(0);
        for (const a of wrong) expect(a.text, right).not.toBe(right);
      }
    });
  });
});

function specs(): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const n of allNodes(MENINGSSMEDJAN)) {
    if (n.type === 'stage') out.push(n.spec);
    else for (const s of n.pool) out.push(s, { ...s, level: s.level + 1 }, ...(n.trap ? [{ ...s, trap: n.trap }, { ...s, level: s.level + 1, trap: n.trap }] : []));
  }
  return out;
}

/** Felen barnet kan göra i en fråga: de fel alternativen, de fel orden, eller en annan ordning. */
function wrongAnswers(q: MQ): { given?: string; tag: string }[] {
  if (q.kind === 'val') return q.alts!.filter((a) => a.err).map((a) => ({ given: a.text, tag: a.err! }));
  if (q.kind === 'markera') return q.tokens!.map((_, i) => i).filter((i) => !q.targets!.includes(i)).map((i) => ({ tag: q.misses?.[i] ?? q.missTag! }));
  const tiles = q.tiles!;
  return [tiles.join(' '), [...tiles].reverse().join(' ')].filter((g) => !isRight(q, g)).map((given) => ({ given, tag: diagnoseAny(meningGame, q, given) }));
}

describe('frågorna', () => {
  it('ett rätt svar, och förklaringar som inte avslöjar svaret', () => {
    for (const spec of specs()) {
      for (let seed = 0; seed < 80; seed++) {
        const q = makeQ(spec, rngFrom(seed * 7919 + spec.level));
        const where = `${JSON.stringify(spec)} ${q.topic} ${q.answer}`;
        expect(skillLabel(q.skill), q.skill).not.toBe('något du har övat på');
        expect(meningGame.specsForSkill(q.skill).length, q.skill).toBeGreaterThan(0);
        expect(meningGame.solution(q), where).not.toContain('undefined');
        if (q.kind === 'val') {
          expect(q.alts!.filter((a) => !a.err).map((a) => a.text), where).toEqual([q.answer]);
          expect(new Set(q.alts!.map((a) => a.text)).size, where).toBe(q.alts!.length);
          for (const a of q.alts!) expect(isRight(q, a.text), `${where}: ${a.text}`).toBe(!a.err);
          if (q.sentence) expect(q.sentence.split('___').length, where).toBe(2);
        }
        if (q.kind === 'markera') expect(q.tokens![q.targets![0]], where).toBeTruthy();
        if (q.kind === 'ordna') {
          expect(isRight(q, q.tiles!.join(' ')), `${where} blandat men redan rätt`).toBe(false);
          for (const o of orders(q.row)) expect(isRight(q, o), o).toBe(true);
        }
        const h = hintFor(meningGame, q);
        expect(reveals(h, q.answer), `ledtråd: ${where}: ${h}`).toBe(false);
        for (const { given, tag } of wrongAnswers(q)) {
          expect(meningGame.errLabels[tag], `${where} ${tag}`).toBeTruthy();
          if (given !== undefined) expect(diagnoseAny(meningGame, q, given), `${where}: ${given}`).toBe(tag);
          const ex = explainAny(meningGame, tag, q, given ?? '');
          expect(reveals(`${ex.title} ${ex.text}`, q.answer), `${where} ${tag}: ${ex.text}`).toBe(false);
          expect(`${ex.title} ${ex.text}`, `behövde maskas: ${where} ${tag}`).not.toContain('…');
        }
      }
    }
  });

  it('bossens fälla kan alltid slå till', () => {
    for (const n of allNodes(MENINGSSMEDJAN)) {
      if (n.type !== 'boss' || !n.trap) continue;
      for (const s of n.pool) for (let seed = 0; seed < 80; seed++) {
        const q = makeQ({ ...s, trap: n.trap }, rngFrom(seed));
        expect(wrongAnswers(q).some((w) => w.tag === n.trap), `${n.id} ${q.answer}`).toBe(true);
      }
    }
  });

  it('ingen fråga kommer tillbaka i samma runda', () => {
    for (const n of allNodes(MENINGSSMEDJAN)) {
      if (n.type !== 'stage') continue;
      expect(items(n.spec.mode, n.spec.level).length, n.id).toBeGreaterThanOrEqual(10);
      const qs = Array.from({ length: 10 }, (_, i) => makeQ(n.spec, rngFrom(i), { seed: 7, index: i }));
      expect(new Set(qs.map((q) => `${q.topic}/${q.row}`)).size, n.id).toBe(10);
    }
  });

  it('nivå 0 använder bara de lättare meningarna', () => {
    for (let seed = 0; seed < 300; seed++) {
      const q = makeQ({ mode: 'blandat', level: 0 }, rngFrom(seed));
      if (q.topic === 'tecken') expect(TECKEN[q.row][2]).toBe(1);
      if (q.topic === 'ordfoljd') expect(BYGG[q.row][2]).toBe(1);
      if (q.topic === 'samband') expect(SAMBAND[q.row][4]).toBe(1);
    }
  });
});
