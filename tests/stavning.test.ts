import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { core, diagnoseAny, editTag, explainAny, isRight, same } from '../src/engines/ord/check';
import { stavningGame } from '../src/games/stavning';
import { diagnose, distractors, ENTRIES, makeQ, variants, type Entry, type SQ } from '../src/games/stavning/logic';
import { STAVNINGSTRASKET } from '../src/games/stavning/content';
import { skillLabel } from '../src/content/skills';
import { allNodes, type QuestionSpec } from '../src/platform/rpg/types';

// Stavningsträsket: orden passar sina regler, felen känns igen, och förklaringarna avslöjar aldrig svaret.

const word = (w: string) => ENTRIES.find((e) => e.word === w)!;
const q = (w: string, level = 1): SQ => {
  const e = word(w);
  return { mode: e.rule, level, skill: `sv.stav.${e.rule}`, rule: e.rule, kind: level === 0 ? 'val' : 'skriv', prompt: '', answer: e.word, caseStrict: e.rule === 'stor', alts: [] };
};
const tag = (w: string, given: string) => diagnoseAny(stavningGame, q(w), given);

/** Ordet förekommer som eget ord i texten (inte som del av ett längre ord). */
const reveals = (text: string, answer: string) =>
  text.split(/[\s"'(),.!?:;–-]+/).some((t) => t.toLocaleLowerCase('sv') === answer.toLocaleLowerCase('sv'));

const FITS: Record<Entry['rule'], RegExp> = {
  smaord: /./, dubbel: /(bb|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt|vv)/, lang: /^[^]*$/, m: /(m$|mm)/, ck: /ck/, ng: /(ng|nk|gn)/,
  j: /^(hj|dj|lj|gj|g[eiyäö]|j)/, sj: /(sj|skj|stj|sch|ch|sk[eiyäöa]|tion|ge$)/, tj: /(tj|kj|^k[eiyäö])/, oa: /o/, stor: /./, sammansatt: /./,
};

describe('Stavningsträskets ord', () => {
  it('varje ord står exakt en gång i sin mening, aldrig först, och passar sin regel', () => {
    for (const e of ENTRIES) {
      const toks = e.sentence.split(' ');
      expect(toks.filter((t) => core(t) === e.word).length, e.word).toBe(1);
      expect(core(toks[0]), e.word).not.toBe(e.word);
      expect(e.word, e.rule).toMatch(FITS[e.rule]);
      if (e.rule === 'lang') expect(e.word, e.word).not.toMatch(/(bb|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt|vv|ck)/);
      if (e.rule === 'sammansatt') expect(e.parts?.length, e.word).toBe(2);
      if (e.rule !== 'stor') expect(e.word, e.word).toBe(e.word.toLocaleLowerCase('sv'));
    }
  });

  it('inga dubbletter', () => {
    const ws = ENTRIES.map((e) => e.word);
    expect(ws.filter((w, i) => ws.indexOf(w) !== i)).toEqual([]);
  });

  it('varje ord har minst ett fel alternativ med regelns felkod, och inget fel alternativ är rätt svar', () => {
    for (const e of ENTRIES) {
      const d = distractors(e);
      expect(d.length, e.word).toBeGreaterThan(0);
      for (const a of d) {
        expect(same(a.text, e.word, e.rule === 'stor'), `${e.word} ${a.text}`).toBe(false);
        expect(a.err, `${e.word} ${a.text}`).toBeTruthy();
      }
    }
  });
});

describe('diagnos', () => {
  it('känner igen typiska stavfel', () => {
    expect(tag('hoppa', 'hopa')).toBe('enkel-konsonant');
    expect(tag('katten', 'katen')).toBe('enkel-konsonant');
    expect(tag('glas', 'glass')).toBe('dubbel-konsonant');
    expect(tag('taket', 'tacket')).toBe('dubbel-konsonant');
    expect(tag('rum', 'rumm')).toBe('m-regeln');
    expect(tag('rummet', 'rumet')).toBe('enkel-konsonant');
    expect(tag('tack', 'takk')).toBe('ck');
    expect(tag('tack', 'tak')).toBe('enkel-konsonant');
    expect(tag('banken', 'bangken')).toBe('ng-ljud');
    expect(tag('regn', 'rengn')).toBe('ng-ljud');
    expect(tag('hjälpa', 'jälpa')).toBe('j-ljud');
    expect(tag('göra', 'jöra')).toBe('j-ljud');
    expect(tag('sjö', 'schö')).toBe('sj-ljud');
    expect(tag('skjorta', 'sjorta')).toBe('sj-ljud');
    expect(tag('station', 'stasjon')).toBe('sj-ljud');
    expect(tag('tjugo', 'sjugo')).toBe('tj-ljud');
    expect(tag('köket', 'tjöket')).toBe('tj-ljud');
    expect(tag('sova', 'såva')).toBe('o-a');
    expect(tag('och', 'å')).toBe('talsprak');
    expect(tag('roligt', 'rolit')).toBe('talsprak');
    expect(tag('Malmö', 'malmö')).toBe('stor-bokstav');
    expect(tag('måndag', 'Måndag')).toBe('liten-bokstav');
    expect(tag('glassbil', 'glass bil')).toBe('sarskrivning');
    expect(tag('glassbil', 'glas bil')).not.toBe('sarskrivning');
    expect(tag('hoppa', 'hopppa')).toBe('bokstav-extra');
    expect(tag('blomma', 'bomma')).toBe('bokstav-saknas');
    expect(tag('flicka', 'filcka')).toBe('bytt-ordning');
    expect(tag('hoppa', 'xyz')).toBe('annat');
  });

  it('stor bokstav räknas bara där det är poängen', () => {
    expect(isRight(q('hoppa'), 'Hoppa')).toBe(true);
    expect(isRight(q('hoppa'), ' hoppa. ')).toBe(true);
    expect(isRight(q('Malmö'), 'malmö')).toBe(false);
    expect(isRight(q('måndag'), 'måndag')).toBe(true);
  });

  it('enkla redigeringsfel', () => {
    expect(editTag('katt', 'kat')).toBe('bokstav-saknas');
    expect(editTag('katt', 'kattt')).toBe('bokstav-extra');
    expect(editTag('katt', 'ktat')).toBe('bytt-ordning');
    expect(editTag('katt', 'hund')).toBeUndefined();
  });
});

/** Alla frågeinställningar området använder: banor och bossar (med och utan fälla, och fas 2). */
function specs(): QuestionSpec[] {
  const out: QuestionSpec[] = [];
  for (const n of allNodes(STAVNINGSTRASKET)) {
    if (n.type === 'stage') out.push(n.spec);
    else for (const s of n.pool) out.push(s, { ...s, level: s.level + 1 }, ...(n.trap ? [{ ...s, trap: n.trap }, { ...s, level: s.level + 1, trap: n.trap }] : []));
  }
  return out;
}

describe('frågorna', () => {
  it('varje fråga går att svara på, har ett namn, och förklaringar som inte avslöjar svaret', () => {
    for (const spec of specs()) {
      for (let seed = 0; seed < 60; seed++) {
        const x = makeQ(spec, rngFrom(seed * 7919 + spec.level));
        const where = `${JSON.stringify(spec)} ${x.answer}`;
        expect(skillLabel(x.skill), x.skill).not.toBe('något du har övat på');
        expect(stavningGame.specsForSkill(x.skill).length, x.skill).toBeGreaterThan(0);
        expect(stavningGame.hint(x).length).toBeGreaterThan(10);
        expect(reveals(stavningGame.hint(x), x.answer), `ledtråd: ${where}`).toBe(false);
        for (const t of Object.keys(stavningGame.errLabels)) {
          const ex = stavningGame.explain(t, x, '');
          expect(reveals(`${ex.title} ${ex.text}`, x.answer), `${where} ${t}: ${ex.text}`).toBe(false);
          expect(ex.text, `${where} ${t}`).not.toMatch(/""|undefined/);
        }
        expect(stavningGame.solution(x)).toContain(x.answer);
        if (x.kind === 'markera') {
          expect(x.targets!.length, where).toBeGreaterThan(0);
          expect(x.tokens!.some((t) => core(t) === x.answer), where).toBe(false);
          continue;
        }
        expect(x.sentence!.split('___').length, where).toBe(2);
        expect(reveals(x.sentence!, x.answer), where).toBe(false);
        expect(x.alts!.filter((a) => !a.err).map((a) => a.text), where).toEqual([x.answer]);
        expect(new Set(x.alts!.map((a) => a.text)).size, where).toBe(x.alts!.length);
        // Alla fel barnet kan tänkas göra: de fel alternativen, regelns felstavningar och några skrivfel.
        const e = ENTRIES.find((y) => y.word === x.answer)!;
        const wrongs = [...x.alts!.filter((a) => a.err).map((a) => a.text), ...variants(e).map((a) => a.text), x.answer.slice(1), `${x.answer}e`, 'xyz'];
        for (const given of wrongs.filter((g) => !isRight(x, g))) {
          const t = diagnoseAny(stavningGame, x, given);
          const ex = explainAny(stavningGame, t, x, given);
          expect(reveals(`${ex.title} ${ex.text}`, x.answer), `${where}: ${given} → ${t}: ${ex.text}`).toBe(false);
          expect(ex.text, `${where} ${t}`).not.toContain('undefined');
          expect(`${ex.title} ${ex.text}`, `behövde maskas: ${where} ${t}`).not.toContain('…');
        }
      }
    }
  });

  it('valfrågornas fel alternativ ger regelns felkod', () => {
    for (const e of ENTRIES) for (const a of distractors(e)) expect(diagnose(q(e.word), a.text), `${e.word} ${a.text}`).toBe(a.err);
  });

  it('bossens fälla: ett av de fel alternativen är just det felet', () => {
    for (const n of allNodes(STAVNINGSTRASKET)) {
      if (n.type !== 'boss' || !n.trap) continue;
      for (const s of n.pool) for (let seed = 0; seed < 80; seed++) {
        const x = makeQ({ ...s, trap: n.trap }, rngFrom(seed));
        if (x.kind === 'markera') expect(x.missTag).toBe(n.trap);
        else expect(x.alts!.some((a) => a.err === n.trap), `${n.id} ${x.answer}`).toBe(true);
      }
    }
  });

  it('inget ord kommer tillbaka i samma runda (kortleken)', () => {
    for (const n of allNodes(STAVNINGSTRASKET)) {
      if (n.type !== 'stage') continue;
      const words = Array.from({ length: 10 }, (_, i) => makeQ(n.spec, rngFrom(i), { seed: 1234, index: i }).answer);
      expect(new Set(words).size, n.id).toBe(10);
      // samma runda, samma fråga – även efter omladdning
      expect(makeQ(n.spec, rngFrom(3), { seed: 1234, index: 3 }).answer).toBe(words[3]);
    }
  });

  it('nivå 0–1 använder bara de lättare orden', () => {
    for (let seed = 0; seed < 300; seed++) {
      const x = makeQ({ mode: 'blandat', level: 1 }, rngFrom(seed));
      expect(ENTRIES.find((e) => e.word === x.answer)!.band).toBe(1);
    }
  });
});
