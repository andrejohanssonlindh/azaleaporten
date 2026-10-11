import { useEffect, useRef, useState } from 'preact/hooks';
import type { Note } from './types';

// Verktygslådan vid svårare frågor: räknare, kladdpapper att rita på, egna anteckningar och ett formelkort.
// Som på ett riktigt prov: verktygen hjälper med räknandet, men tänkandet gör man själv.
// Vald flik, anteckningar och räknarens remsa finns kvar mellan frågorna; kladdpapperet är nytt för varje fråga.

type Tab = 'raknare' | 'rita' | 'skriv' | 'formler';

const mem = { tab: null as Tab | null, text: '', tape: [] as string[], paper: { key: null as unknown, strokes: [] as number[][] } };

/* ---------- räknaren ---------- */

type Tok = number | string;

function tokenize(s: string): Tok[] | null {
  const out: Tok[] = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/[0-9,]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9,]/.test(s[j])) j++;
      const t = s.slice(i, j);
      if ((t.match(/,/g) ?? []).length > 1 || t === ',') return null;
      out.push(Number(t.replace(',', '.')));
      i = j;
    } else if ('+−×÷()²π'.includes(c)) { out.push(c); i++; } else if (c === ' ') i++;
    else return null;
  }
  return out;
}

/** Räknar ut ett uttryck som "3,14 × 5²" med vanlig prioritetsordning. null = går inte att räkna ut. */
export function calc(s: string): number | null {
  const tok = tokenize(s);
  if (!tok || !tok.length) return null;
  const t = tok;
  let i = 0;
  const peek = () => t[i];
  const startsFactor = (x: Tok | undefined) => typeof x === 'number' || x === 'π' || x === '(';
  function primary(): number {
    const x = t[i++];
    if (typeof x === 'number') return x;
    if (x === 'π') return Math.PI;
    if (x === '(') { const v = sum(); if (t[i++] !== ')') throw 0; return v; }
    throw 0;
  }
  function power(): number { let v = primary(); while (peek() === '²') { i++; v *= v; } return v; }
  function unary(): number { if (peek() === '−') { i++; return -unary(); } return power(); }
  function product(): number {
    let v = unary();
    for (;;) {
      const op = peek();
      if (op === '×') { i++; v *= unary(); } else if (op === '÷') { i++; const d = unary(); if (d === 0) throw 0; v /= d; } else if (startsFactor(op)) v *= unary(); // 2π = 2 × π
      else return v;
    }
  }
  function sum(): number {
    let v = product();
    for (;;) {
      const op = peek();
      if (op === '+') { i++; v += product(); } else if (op === '−') { i++; v -= product(); } else return v;
    }
  }
  try {
    const v = sum();
    return i === t.length && Number.isFinite(v) ? v : null;
  } catch { return null; }
}

export const fmtCalc = (n: number) => String(Number(n.toFixed(6))).replace('.', ',').replace('-', '−');

const KEYS: [string, string][] = [
  ['C', 'Rensa'], ['(', 'Vänsterparentes'], [')', 'Högerparentes'], ['⌫', 'Sudda en'], ['÷', 'Delat med'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['π', 'Pi'], ['×', 'Gånger'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['x²', 'I kvadrat'], ['−', 'Minus'],
  ['1', '1'], ['2', '2'], ['3', '3'], [',', 'Komma'], ['+', 'Plus'],
  ['0', '0'], ['=', 'Är lika med'],
];

function Calculator() {
  const [expr, setExpr] = useState('');
  const [shown, setShown] = useState<string | null>(null);
  const [tape, setTape] = useState(mem.tape);

  function press(k: string) {
    if (k === 'C') { setExpr(''); setShown(null); return; }
    if (k === '⌫') { setShown(null); setExpr((e) => e.slice(0, -1)); return; }
    if (k === '=') {
      const v = calc(expr);
      if (v === null) { setShown('Det går inte att räkna ut'); return; }
      const line = `${expr} = ${fmtCalc(v)}`;
      mem.tape = [line, ...mem.tape.filter((x) => x !== line)].slice(0, 4);
      setTape(mem.tape);
      setShown(fmtCalc(v));
      return;
    }
    const key = k === 'x²' ? '²' : k;
    if (shown !== null) {
      // Efter = : en siffra börjar om, ett räknesätt räknar vidare med svaret.
      const v = calc(expr);
      setExpr(/[+−×÷²]/.test(key) && v !== null ? fmtCalc(v) + key : key);
      setShown(null);
      return;
    }
    setExpr((e) => (e + key).slice(0, 40));
  }

  function onKey(e: KeyboardEvent) {
    const map: Record<string, string> = { '*': '×', x: '×', '/': '÷', ':': '÷', '-': '−', '.': ',', Enter: '=', Backspace: '⌫', Escape: 'C', p: 'π', '^': 'x²' };
    const k = map[e.key] ?? e.key;
    if (KEYS.some(([x]) => x === k) || k === '=') { e.preventDefault(); e.stopPropagation(); press(k); }
  }

  return (
    <div class="calc" tabIndex={0} onKeyDown={onKey} aria-label="Räknare">
      <div class="calc-screen" aria-live="polite">
        <div class="calc-expr">{expr || ' '}</div>
        <div class="calc-out">{shown ?? (expr ? '' : '0')}</div>
      </div>
      <div class="calc-keys">
        {KEYS.map(([k, label]) => (
          <button key={k} type="button" aria-label={label} class={`calc-key${/[0-9,]/.test(k) ? ' num' : k === '=' ? ' eq-key' : ''}${k === '0' ? ' wide3' : k === '=' ? ' wide2' : ''}`}
            onClick={() => press(k)}>{k}</button>
        ))}
      </div>
      {tape.length > 0 && <ul class="calc-tape" aria-label="Tidigare uträkningar">{tape.map((l) => <li key={l}>{l}</li>)}</ul>}
    </div>
  );
}

/* ---------- kladdpapperet ---------- */

function Paper({ qKey }: { qKey: unknown }) {
  const ref = useRef<HTMLCanvasElement>(null);
  if (mem.paper.key !== qKey) mem.paper = { key: qKey, strokes: [] };

  function draw() {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.strokeStyle = getComputedStyle(c).color;
    g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of mem.paper.strokes) {
      g.beginPath();
      g.moveTo(s[0], s[1]);
      for (let i = 2; i < s.length; i += 2) g.lineTo(s[i], s[i + 1]);
      if (s.length === 2) g.lineTo(s[0] + 0.1, s[1]);
      g.stroke();
    }
  }
  useEffect(draw, []);

  const at = (e: PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e: PointerEvent) => { ref.current!.setPointerCapture(e.pointerId); mem.paper.strokes.push(at(e)); draw(); };
  const move = (e: PointerEvent) => {
    if (!ref.current!.hasPointerCapture(e.pointerId)) return;
    mem.paper.strokes[mem.paper.strokes.length - 1].push(...at(e));
    draw();
  };
  return (
    <div class="paper-wrap">
      <canvas ref={ref} class="paper" aria-label="Kladdpapper: rita med fingret eller musen" onPointerDown={down} onPointerMove={move} />
      <div class="row center-row">
        <button type="button" class="btn small" onClick={() => { mem.paper.strokes.pop(); draw(); }}>↩️ Ångra</button>
        <button type="button" class="btn small" onClick={() => { mem.paper.strokes = []; draw(); }}>🧽 Sudda allt</button>
      </div>
    </div>
  );
}

function Notes() {
  const [text, setText] = useState(mem.text);
  return (
    <textarea class="notes" rows={5} value={text} placeholder="Skriv dina anteckningar här. De finns kvar till nästa fråga."
      aria-label="Anteckningar" onInput={(e) => { mem.text = e.currentTarget.value; setText(mem.text); }} />
  );
}

export function Tools({ qKey, calcOn, notes }: { qKey: unknown; calcOn: boolean; notes: Note[] }) {
  const tabs: [Tab, string][] = [
    ...(calcOn ? [['raknare', '🧮 Räknare'] as [Tab, string]] : []),
    ['rita', '✏️ Rita'], ['skriv', '📝 Anteckna'],
    ...(notes.length ? [['formler', '📒 Formler'] as [Tab, string]] : []),
  ];
  const [tab, setTab] = useState<Tab | null>(tabs.some(([t]) => t === mem.tab) ? mem.tab : null);
  const pick = (t: Tab) => { const next = tab === t ? null : t; mem.tab = next; setTab(next); };
  return (
    <div class="tools">
      <div class="tool-tabs" role="group" aria-label="Verktyg">
        {tabs.map(([t, label]) => <button key={t} type="button" class={`btn small tool-tab${tab === t ? ' on' : ''}`} aria-pressed={tab === t} onClick={() => pick(t)}>{label}</button>)}
      </div>
      {tab === 'raknare' && <Calculator />}
      {tab === 'rita' && <Paper qKey={qKey} />}
      {tab === 'skriv' && <Notes />}
      {tab === 'formler' && (
        <dl class="formulas">
          {notes.map((n) => <div key={n.name}><dt>{n.name}</dt><dd>{n.text}</dd></div>)}
        </dl>
      )}
    </div>
  );
}
