import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { deckPick } from '../../engines/ord/check';
import { rngFrom } from '../../platform/rng';

// Pythonhamnen: små Python-program. Vad skriver programmet ut? Och vilken rad är fel?
// Fel svar kommer från vanliga missuppfattningar (citattecken, range börjar på 0 …). Färdighets-id:n är permanenta.

export interface PyQ extends OrdQ {
  /** Programmets rader (visas som kod ovanför frågan). Saknas i fel-frågorna, där raderna är det man trycker på. */
  code?: string[];
  /** fel: vad som är fel på raden (visas när frågan är klar). */
  why?: string;
}

const SKILL: Record<string, string> = {
  print: 'prog.py.print', variabel: 'prog.py.variabel', text: 'prog.py.text', if: 'prog.py.if', for: 'prog.py.for', fel: 'prog.py.fel',
};

export const ERR: Record<string, string> = {
  citat: 'Blandade ihop text och värde (citattecken)',
  'citat-syns': 'Trodde att citattecknen skrivs ut',
  'skriver-koden': 'Trodde att koden skrivs ut',
  'raknar-text': 'Räknade ut text',
  'text-plus': 'Räknade ihop text som tal',
  mellanslag: 'Lade till mellanslag',
  'fel-raknesatt': 'Fel räknesätt',
  'samma-rad': 'Trodde att print skriver på samma rad',
  nerifran: 'Körde inte uppifrån och ned',
  'gamla-vardet': 'Använde det gamla värdet',
  'variabel-foljer': 'Trodde att variabeln följer med',
  'storre-mindre': 'Blandade ihop större och mindre',
  'storre-eller-lika': 'Trodde att > gäller även lika',
  'bada-grenarna': 'Trodde att både if och else körs',
  'range-noll': 'Glömde att range börjar på 0',
  'range-slut': 'Trodde att range tar med sista talet',
  'loop-en-gang': 'Körde loopen bara en gång',
  'loop-antal': 'Fel antal varv',
  'fel-sak': 'Gick inte igenom koden rad för rad',
  'fel-rad': 'Pekade på en rad som är rätt',
};

const ORD = ['Hej', 'Robot', 'Kod', 'Glass', 'Pizza', 'Katt', 'Sol', 'Boll', 'Fisk', 'Moln', 'Raket'];
const NAMN = ['Robo', 'Bit', 'Pixel', 'Kim', 'Sam', 'Alex', 'Noa', 'Vic'];
const lines = (...l: (string | number)[]) => l.join('\n');
const n = (rng: Rng, lo: number, hi: number) => lo + rng.int(hi - lo + 1);

interface Made { code: string[]; answer: string; alts: Alt[] }
type Tmpl = { id: string; level: 0 | 1; make: (rng: Rng) => Made };

/** Alternativen utan dubbletter (rätt svar först). */
const uniq = (answer: string, wrong: Alt[]): Alt[] => {
  const seen = new Set([answer]);
  const out: Alt[] = [{ text: answer }];
  for (const a of wrong) if (!seen.has(a.text)) { seen.add(a.text); out.push(a); }
  return out;
};

const TMPL: Record<string, Tmpl[]> = {
  print: [
    { id: 'ord', level: 0, make: (rng) => {
      const w = rng.pick(ORD);
      return { code: [`print("${w}")`], answer: w, alts: [{ text: `"${w}"`, err: 'citat-syns' }, { text: `print("${w}")`, err: 'skriver-koden' }] };
    } },
    { id: 'plus', level: 0, make: (rng) => {
      const a = n(rng, 2, 9), b = n(rng, 2, 9);
      return { code: [`print(${a} + ${b})`], answer: String(a + b), alts: [{ text: `${a} + ${b}`, err: 'citat' }, { text: `${a}${b}`, err: 'text-plus' }] };
    } },
    { id: 'plus-text', level: 0, make: (rng) => {
      const a = n(rng, 2, 9), b = n(rng, 2, 9);
      return { code: [`print("${a} + ${b}")`], answer: `${a} + ${b}`, alts: [{ text: String(a + b), err: 'raknar-text' }, { text: `"${a} + ${b}"`, err: 'citat-syns' }] };
    } },
    { id: 'tva-rader', level: 1, make: (rng) => {
      const [a, b] = rng.shuffle(ORD);
      return { code: [`print("${a}")`, `print("${b}")`], answer: lines(a, b), alts: [{ text: `${a}${b}`, err: 'samma-rad' }, { text: lines(b, a), err: 'nerifran' }, { text: b, err: 'fel-sak' }] };
    } },
    { id: 'gånger', level: 1, make: (rng) => {
      const a = n(rng, 3, 9), b = n(rng, 3, 9);
      return { code: [`print(${a} * ${b})`], answer: String(a * b), alts: [{ text: String(a + b), err: 'fel-raknesatt' }, { text: `${a} * ${b}`, err: 'citat' }] };
    } },
  ],
  variabel: [
    { id: 'x', level: 0, make: (rng) => {
      const v = n(rng, 2, 99);
      return { code: [`x = ${v}`, 'print(x)'], answer: String(v), alts: [{ text: 'x', err: 'citat' }, { text: `x = ${v}`, err: 'skriver-koden' }] };
    } },
    { id: 'x-citat', level: 0, make: (rng) => {
      const v = n(rng, 2, 99), name = rng.pick(['x', 'tal', 'poang']);
      return { code: [`${name} = ${v}`, `print("${name}")`], answer: name, alts: [{ text: String(v), err: 'citat' }, { text: `"${name}"`, err: 'citat-syns' }] };
    } },
    { id: 'namn', level: 0, make: (rng) => {
      const nm = rng.pick(NAMN);
      return { code: [`namn = "${nm}"`, 'print(namn)'], answer: nm, alts: [{ text: 'namn', err: 'citat' }, { text: `"${nm}"`, err: 'citat-syns' }] };
    } },
    { id: 'okar', level: 1, make: (rng) => {
      const a = n(rng, 2, 9), b = n(rng, 2, 9);
      return { code: [`x = ${a}`, `x = x + ${b}`, 'print(x)'], answer: String(a + b), alts: [{ text: String(a), err: 'gamla-vardet' }, { text: `x + ${b}`, err: 'citat' }, { text: String(b), err: 'fel-sak' }] };
    } },
    { id: 'kopia', level: 1, make: (rng) => {
      const [p, q] = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]);
      return { code: [`a = ${p}`, 'b = a', `a = ${q}`, 'print(b)'], answer: String(p), alts: [{ text: String(q), err: 'variabel-foljer' }, { text: 'a', err: 'citat' }] };
    } },
    { id: 'halsa', level: 1, make: (rng) => {
      const nm = rng.pick(NAMN);
      return { code: [`namn = "${nm}"`, 'print("Hej " + namn)'], answer: `Hej ${nm}`, alts: [{ text: 'Hej namn', err: 'citat' }, { text: `Hej${nm}`, err: 'mellanslag' }] };
    } },
  ],
  text: [
    { id: 'siffertext', level: 0, make: (rng) => {
      const a = n(rng, 1, 9), b = n(rng, 1, 9);
      return { code: [`print("${a}" + "${b}")`], answer: `${a}${b}`, alts: [{ text: String(a + b), err: 'text-plus' }, { text: `${a} ${b}`, err: 'mellanslag' }] };
    } },
    { id: 'gånger-text', level: 0, make: (rng) => {
      const w = rng.pick(['ha', 'bla', 'hej', 'pip', 'mu']), k = n(rng, 2, 4);
      return { code: [`print("${w}" * ${k})`], answer: w.repeat(k), alts: [{ text: `${w}${k}`, err: 'raknar-text' }, { text: Array(k).fill(w).join(' '), err: 'mellanslag' }] };
    } },
    { id: 'ihop', level: 0, make: (rng) => {
      const [a, b] = rng.pick([['Glass', 'bil'], ['Sol', 'stol'], ['Fot', 'boll'], ['Snö', 'gubbe'], ['Regn', 'båge'], ['Mat', 'säck']]);
      return { code: [`print("${a}" + "${b}")`], answer: `${a}${b}`, alts: [{ text: `${a} ${b}`, err: 'mellanslag' }, { text: `${a} + ${b}`, err: 'raknar-text' }] };
    } },
    { id: 'variabeltext', level: 1, make: (rng) => {
      const a = n(rng, 1, 9), b = n(rng, 1, 9);
      return { code: [`x = "${a}"`, `y = "${b}"`, 'print(x + y)'], answer: `${a}${b}`, alts: [{ text: String(a + b), err: 'text-plus' }, { text: 'xy', err: 'citat' }] };
    } },
    { id: 'tal-och-text', level: 1, make: (rng) => {
      const a = n(rng, 2, 9), b = n(rng, 2, 9);
      return { code: [`x = ${a}`, `y = ${b}`, 'print(x + y)'], answer: String(a + b), alts: [{ text: `${a}${b}`, err: 'text-plus' }, { text: 'xy', err: 'citat' }] };
    } },
  ],
  if: [
    { id: 'storre', level: 0, make: (rng) => {
      const m = n(rng, 3, 9), x = rng.next() < 0.5 ? m + n(rng, 1, 5) : m - n(rng, 1, 2);
      const yes = x > m;
      return { code: [`x = ${x}`, `if x > ${m}:`, '    print("Stor")', 'else:', '    print("Liten")'], answer: yes ? 'Stor' : 'Liten',
        alts: [{ text: yes ? 'Liten' : 'Stor', err: 'storre-mindre' }, { text: lines('Stor', 'Liten'), err: 'bada-grenarna' }] };
    } },
    { id: 'lika', level: 0, make: (rng) => {
      const m = n(rng, 3, 9);
      return { code: [`x = ${m}`, `if x > ${m}:`, '    print("Ja")', 'else:', '    print("Nej")'], answer: 'Nej',
        alts: [{ text: 'Ja', err: 'storre-eller-lika' }, { text: lines('Ja', 'Nej'), err: 'bada-grenarna' }] };
    } },
    { id: 'mindre', level: 1, make: (rng) => {
      const t = n(rng, 5, 30), g = rng.pick([10, 15, 20]);
      if (t === g) return TMPL.if[2].make(rng);
      const yes = t < g;
      return { code: [`grader = ${t}`, `if grader < ${g}:`, '    print("Kallt")', 'else:', '    print("Varmt")'], answer: yes ? 'Kallt' : 'Varmt',
        alts: [{ text: yes ? 'Varmt' : 'Kallt', err: 'storre-mindre' }, { text: lines('Kallt', 'Varmt'), err: 'bada-grenarna' }] };
    } },
    { id: 'lika-med', level: 1, make: (rng) => {
      const a = n(rng, 2, 6), b = n(rng, 2, 6), m = rng.next() < 0.5 ? a + b : a + b + 1;
      const yes = a + b === m;
      return { code: [`x = ${a} + ${b}`, `if x == ${m}:`, '    print("Rätt")', 'else:', '    print("Fel")'], answer: yes ? 'Rätt' : 'Fel',
        alts: [{ text: yes ? 'Fel' : 'Rätt', err: 'fel-sak' }, { text: lines('Rätt', 'Fel'), err: 'bada-grenarna' }] };
    } },
    { id: 'utan-else', level: 1, make: (rng) => {
      const m = n(rng, 3, 9), x = rng.next() < 0.5 ? m + n(rng, 1, 4) : m - n(rng, 1, 2), w = rng.pick(ORD);
      const yes = x > m;
      const both = lines(w, 'Klart');
      return { code: [`x = ${x}`, `if x > ${m}:`, `    print("${w}")`, 'print("Klart")'], answer: yes ? both : 'Klart',
        alts: [{ text: yes ? 'Klart' : both, err: 'storre-mindre' }, { text: w, err: 'fel-sak' }] };
    } },
  ],
  for: [
    { id: 'range', level: 0, make: (rng) => {
      const k = n(rng, 2, 5);
      const r = (from: number, to: number) => lines(...Array.from({ length: to - from }, (_, i) => from + i));
      return { code: [`for i in range(${k}):`, '    print(i)'], answer: r(0, k), alts: [{ text: r(1, k + 1), err: 'range-noll' }, { text: r(0, k + 1), err: 'range-slut' }] };
    } },
    { id: 'hej', level: 0, make: (rng) => {
      const k = n(rng, 2, 4), w = rng.pick(ORD);
      const rep = (c: number) => lines(...Array(c).fill(w));
      return { code: [`for i in range(${k}):`, `    print("${w}")`], answer: rep(k), alts: [{ text: w, err: 'loop-en-gang' }, { text: rep(k + 1), err: 'loop-antal' }] };
    } },
    { id: 'fran-till', level: 1, make: (rng) => {
      const a = n(rng, 1, 3), b = a + n(rng, 2, 3);
      const r = (from: number, to: number) => lines(...Array.from({ length: to - from }, (_, i) => from + i));
      return { code: [`for i in range(${a}, ${b}):`, '    print(i)'], answer: r(a, b), alts: [{ text: r(a, b + 1), err: 'range-slut' }, { text: r(0, b), err: 'range-noll' }] };
    } },
    { id: 'summa', level: 1, make: (rng) => {
      const k = n(rng, 3, 5), s = n(rng, 2, 5);
      return { code: ['summa = 0', `for i in range(${k}):`, `    summa = summa + ${s}`, 'print(summa)'], answer: String(k * s),
        alts: [{ text: String(s), err: 'loop-en-gang' }, { text: String((k + 1) * s), err: 'loop-antal' }, { text: String((k - 1) * s), err: 'loop-antal' }] };
    } },
    { id: 'gånger-i', level: 1, make: (rng) => {
      const k = n(rng, 3, 4), m = n(rng, 2, 5);
      const r = (from: number, to: number) => lines(...Array.from({ length: to - from }, (_, i) => (from + i) * m));
      return { code: [`for i in range(${k}):`, `    print(i * ${m})`], answer: r(0, k), alts: [{ text: r(1, k + 1), err: 'range-noll' }, { text: r(0, k + 1), err: 'range-slut' }] };
    } },
  ],
};

/** fel: program med en felaktig rad. [rader, felets index, vad som är fel]. */
const FEL: { level: 0 | 1; make: (rng: Rng) => [string[], number, string] }[] = [
  { level: 0, make: (rng) => { const w = rng.pick(ORD); return [[`namn = "${rng.pick(NAMN)}"`, `print("${w})`, 'print(namn)'], 1, 'Ett citattecken fattas efter texten.']; } },
  { level: 0, make: (rng) => { const [w, v] = rng.shuffle(ORD); return [[`print("${w}")`, `print("${v}"`, 'print("Klart")'], 1, 'Parentesen stängs aldrig.']; } },
  { level: 0, make: (rng) => { const w = rng.pick(ORD); return [[`x = ${n(rng, 2, 9)}`, `Print("${w}")`, 'print(x)'], 1, 'print ska skrivas med liten bokstav. Python är noga med stor och liten bokstav.']; } },
  { level: 0, make: (rng) => [[`x = ${n(rng, 2, 9)}`, 'prnit(x)', 'print("Klart")'], 1, 'print är felstavat.'] },
  { level: 0, make: (rng) => { const w = rng.pick(ORD); return [[`print("${w}")`, `print("${rng.pick(ORD)}")`, `print(${w}")`], 2, 'Ett citattecken fattas före texten.']; } },
  { level: 1, make: (rng) => { const m = n(rng, 3, 9); return [[`x = ${n(rng, 1, 12)}`, `if x > ${m}`, '    print("Stor")', 'print("Klart")'], 1, 'Efter if-raden ska det stå ett kolon.']; } },
  { level: 1, make: (rng) => [[`for i in range(${n(rng, 2, 5)}):`, 'print(i)', 'print("Klart")'], 1, 'Raden som ska upprepas behöver indrag (mellanslag först), annars hör den inte till loopen.'] },
  { level: 1, make: (rng) => { const m = n(rng, 2, 9); return [[`x = ${n(rng, 1, 9)}`, `if x = ${m}:`, '    print("Lika")'], 1, 'För att jämföra skriver man ==. Ett enda = betyder "lägg in värdet".']; } },
  { level: 1, make: (rng) => [[`for i in range(${n(rng, 2, 5)})`, '    print(i)', 'print("Klart")'], 0, 'Efter for-raden ska det stå ett kolon.'] },
  { level: 1, make: (rng) => { const w = rng.pick(ORD); return [[`x = ${n(rng, 2, 9)}`, 'if x > 5:', `    print("${w}")`, 'else', '    print("Liten")'], 3, 'Efter else ska det stå ett kolon.']; } },
];

function felQ(rng: Rng, lvl: number, ctx?: QuestionCtx): PyQ {
  const pool = FEL.filter((f) => f.level <= lvl);
  const [code, bad, why] = deckPick(pool, rng, ctx, 'fel').make(rng);
  return {
    mode: 'fel', level: lvl, skill: SKILL.fel, kind: 'markera', lines: true, mono: true,
    prompt: 'Programmet fungerar inte. Tryck på raden som är fel.', tokens: code, targets: [bad], missTag: 'fel-rad', answer: code[bad], why,
  };
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): PyQ {
  let mode = spec.mode;
  const lvl = Math.max(0, Math.min(spec.level, 1));
  if (mode === 'blandat') mode = rng.pick(lvl >= 1 ? ['print', 'variabel', 'text', 'if', 'for', 'fel'] : ['print', 'variabel', 'text', 'if', 'fel']);
  if (mode === 'fel') return felQ(rng, lvl, ctx);
  const pool = (TMPL[mode] ?? TMPL.print).filter((t) => t.level <= lvl);
  const one = (r: Rng, k: number): PyQ => {
    for (let tries = 0; ; tries++) {
      const t = pool[(k + tries) % pool.length];
      const m = t.make(r);
      const alts = uniq(m.answer, m.alts);
      if (spec.trap && !alts.some((a) => a.err === spec.trap) && tries < 40) continue;
      return { mode, level: lvl, skill: SKILL[mode], kind: 'val', mono: true, exact: true, caseStrict: true, prompt: 'Vad skriver programmet ut?', code: m.code, answer: m.answer, alts: r.shuffle(alts) };
    }
  };
  if (!ctx) return one(rng, rng.int(pool.length));
  // I en runda: fråga nummer index är den index:e unika frågan i rundans följd (samma program kommer aldrig två gånger).
  const r = rngFrom((ctx.seed ^ (lvl * 7919) ^ [...mode].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) >>> 0);
  const order = r.shuffle(pool.map((_, i) => i));
  const seen = new Set<string>();
  let q = one(r, order[0]);
  for (let i = 0, tries = 0; i <= ctx.index && tries < 400; tries++) {
    q = one(r, order[tries % order.length]);
    const key = q.code!.join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    i++;
  }
  return q;
}

export const diagnose = (): string | undefined => undefined;

export function explain(tag: string, q: PyQ): Explained {
  switch (tag) {
    case 'citat': return { title: 'Text eller värde?', text: 'Med citattecken runt blir det text, och då skrivs det ut precis som det står. Utan citattecken räknar Python ut värdet – eller tittar vad som ligger i variabeln.' };
    case 'citat-syns': return { title: 'Citattecknen syns inte', text: 'Citattecknen visar bara var texten börjar och slutar. De skrivs inte ut.' };
    case 'skriver-koden': return { title: 'Inte koden', text: 'print skriver ut det som står inuti parentesen – inte själva koden.' };
    case 'raknar-text': return { title: 'Text räknas inte', text: 'Inom citattecken är allt text – även siffror och tecken. Python räknar inte ut text.' };
    case 'text-plus': return q.code?.some((l) => l.includes('"'))
      ? { title: 'Text klistras ihop', text: 'När två texter läggs ihop med + klistras de ihop, tecken för tecken. Bara riktiga tal (utan citattecken) räknas ihop.' }
      : { title: 'Tal räknas ihop', text: 'Talen står utan citattecken, så de är riktiga tal. Då räknar + ihop dem.' };
    case 'mellanslag': return { title: 'Inga extra mellanslag', text: 'Python lägger inte till några mellanslag själv. Titta noga på vad som står inom citattecknen.' };
    case 'fel-raknesatt': return { title: 'Vilket räknesätt?', text: 'Titta på räknetecknet igen. I Python betyder * gånger.' };
    case 'samma-rad': return { title: 'En rad var', text: 'Varje print skriver på en egen rad.' };
    case 'nerifran': return { title: 'Uppifrån och ned', text: 'Python kör koden uppifrån och ned, en rad i taget.' };
    case 'gamla-vardet': return { title: 'Värdet ändras', text: 'Programmet körs uppifrån och ned. När variabeln får ett nytt värde glöms det gamla bort.' };
    case 'variabel-foljer': return { title: 'Kopian följer inte med', text: 'b = a ger b det värde som a har just då. Ändras a efteråt följer b inte med.' };
    case 'storre-mindre': return { title: 'Stämmer villkoret?', text: 'Läs jämförelsen noga: > betyder större än och < betyder mindre än. Stämmer det för talet i variabeln?' };
    case 'storre-eller-lika': return { title: 'Större än – inte lika', text: '> stämmer bara om talet är större. Är talen lika stora stämmer det inte.' };
    case 'bada-grenarna': return { title: 'Bara en väg', text: 'Bara en av delarna körs: if-delen om villkoret stämmer, annars else-delen.' };
    case 'range-noll': return { title: 'range börjar på 0', text: 'range börjar räkna från 0 om man inte skriver något annat – inte från 1!' };
    case 'range-slut': return { title: 'Sista talet kommer inte med', text: 'range slutar precis före talet man skriver sist i parentesen. Det talet kommer aldrig med.' };
    case 'loop-en-gang': return { title: 'Flera varv', text: 'Raderna med indrag under for körs en gång för varje varv – inte bara en gång.' };
    case 'loop-antal': return { title: 'Räkna varven', text: 'Hur många tal ger range? Så många varv går loopen.' };
    default: return { title: 'Inte riktigt', text: 'Gå igenom koden en rad i taget, uppifrån och ned. Vad händer på varje rad?' };
  }
}

export const explainMiss = (): Explained => ({
  title: 'Den raden är rätt',
  text: 'Titta noga på varje tecken: citattecken, parenteser, kolon, indrag och stavning. Python är jättenoga!',
});

export function hint(q: PyQ): string {
  if (q.kind === 'markera') return 'Kolla att varje citattecken och parentes har en kompis, och att raderna som startar ett block slutar med kolon.';
  if (q.mode === 'for') return 'Skriv upp varven ett i taget. Vilket tal har i första varvet?';
  if (q.mode === 'if') return 'Stämmer villkoret? Sätt in talet och kolla.';
  return 'Gå igenom koden en rad i taget. Står det citattecken eller inte?';
}

export function solution(q: PyQ): string {
  if (q.kind === 'markera') return `Felet: ${q.answer.trim()} – ${q.why}`;
  return `Programmet skriver ut: ${q.answer}`;
}

export const specsForSkill = (skill: string): QuestionSpec[] => {
  const mode = Object.entries(SKILL).find(([, s]) => s === skill)?.[0];
  return mode ? [{ mode, level: 0 }, { mode, level: 1 }] : [];
};
