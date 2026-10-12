import { describe, expect, it } from 'vitest';
import { rngFrom } from '../src/platform/rng';
import { pythonGame } from '../src/games/python';
import { PYTHONHAMNEN } from '../src/games/python/content';
import { checkArea, checkDecks, checkTraps, specsOf } from './ordcheck';

/** En liten tolk för just de rader Pythonhamnen använder, så att varje rätt svar kontrolleras mot en körning. */
function runPy(code: string[]): string {
  const out: string[] = [];
  const vars: Record<string, number | string> = {};
  const val = (e: string): number | string => {
    e = e.trim();
    const plus = splitTop(e, '+');
    if (plus.length > 1) return plus.map(val).reduce((a, b) => (typeof a === 'string' || typeof b === 'string' ? `${a}${b}` : a + b));
    const times = splitTop(e, '*');
    if (times.length > 1) { const [a, b] = times.map(val); return typeof a === 'string' ? a.repeat(b as number) : (a as number) * (b as number); }
    if (/^".*"$/.test(e)) return e.slice(1, -1);
    if (/^\d+$/.test(e)) return Number(e);
    if (e in vars) return vars[e];
    throw new Error(`okänt: ${e}`);
  };
  const cond = (c: string) => {
    const m = /^(.+?)\s*(==|>|<)\s*(.+)$/.exec(c)!;
    const a = val(m[1]) as number, b = val(m[3]) as number;
    return m[2] === '==' ? a === b : m[2] === '>' ? a > b : a < b;
  };
  const block = (start: number): [string[], number] => {
    const body: string[] = [];
    let i = start;
    while (i < code.length && code[i].startsWith('    ')) body.push(code[i++].slice(4));
    return [body, i];
  };
  for (let i = 0; i < code.length;) {
    const l = code[i];
    let m: RegExpExecArray | null;
    if ((m = /^print\((.*)\)$/.exec(l))) { out.push(String(val(m[1]))); i++; }
    else if ((m = /^if (.+):$/.exec(l))) {
      const [yes, after] = block(i + 1);
      let no: string[] = [], next = after;
      if (code[after] === 'else:') [no, next] = block(after + 1);
      const sub = runPy(cond(m[1]) ? yes : no.length ? no : []);
      if (sub) out.push(sub);
      Object.assign(vars, {});
      i = next;
    } else if ((m = /^for i in range\((\d+)(?:, (\d+))?\):$/.exec(l))) {
      const [body, after] = block(i + 1);
      const from = m[2] ? Number(m[1]) : 0, to = Number(m[2] ?? m[1]);
      for (let k = from; k < to; k++) {
        vars.i = k;
        for (const b of body) {
          const bm = /^(\w+) = (.+)$/.exec(b);
          if (bm) vars[bm[1]] = val(bm[2]);
          else out.push(String(val(/^print\((.*)\)$/.exec(b)![1])));
        }
      }
      i = after;
    } else if ((m = /^(\w+) = (.+)$/.exec(l))) { vars[m[1]] = val(m[2]); i++; }
    else throw new Error(`okänd rad: ${l}`);
  }
  return out.join('\n');
}

/** Delar ett uttryck på ett tecken som inte står inom citattecken. */
function splitTop(e: string, op: string): string[] {
  const parts: string[] = [];
  let cur = '', inStr = false;
  for (const ch of e) {
    if (ch === '"') inStr = !inStr;
    if (ch === op && !inStr) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts;
}

describe('Pythonhamnen', () => {
  it('varje fråga har ett rätt svar, och inget fel avslöjar det', () => checkArea(PYTHONHAMNEN, pythonGame));
  it('bossarnas fällor finns bland alternativen', () => checkTraps(PYTHONHAMNEN, pythonGame));
  it('ingen fråga kommer tillbaka i samma runda (utom felen, som är få)', () => {
    const def = { ...PYTHONHAMNEN, eras: PYTHONHAMNEN.eras.map((e) => ({ ...e, nodes: e.nodes.filter((n) => n.type !== 'stage' || n.spec.mode !== 'fel') })) };
    checkDecks(def, pythonGame, (q) => `${q.code?.join('|')}|${q.answer}`);
  });

  it('rätt svar är precis det programmet skriver ut', () => {
    for (const spec of specsOf(PYTHONHAMNEN)) for (let seed = 0; seed < 40; seed++) {
      const q = pythonGame.make(spec, rngFrom(seed));
      if (!q.code) continue;
      expect(runPy(q.code), q.code.join(' / ')).toBe(q.answer);
    }
  });

  it('felraden är det enda som är fel: utan den kör programmet', () => {
    for (let seed = 0; seed < 60; seed++) {
      const q = pythonGame.make({ mode: 'fel', level: seed % 2 }, rngFrom(seed));
      const ok = q.tokens!.filter((_, i) => i !== q.targets![0]);
      if (q.why!.includes('indrag')) continue;
      // Raderna utan felet ska vara giltiga (en loop eller if utan kropp hoppas över).
      for (const l of ok) expect(/^(print\(.*\)|\w+ = .+|if .+:|for .+:|else:|    .+)$/.test(l), l).toBe(true);
      expect(/^(print\("[^"]*"\)|print\(\w+\)|\w+ = (\d+|"[^"]*")|if x [<>] \d+:|for i in range\(\d+\):|else:|    print\(.*\))$/.test(q.answer), q.answer).toBe(false);
    }
  });
});
