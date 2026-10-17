import { useEffect, useRef, useState } from 'preact/hooks';
import { BITAR, LOST, PLATSER, dragAxel, dragVarv, invDrag, parse, platsVid, visa, vrid, type Drag, type Kub, type Vec } from './kub';

// Kuben i 3D med CSS-transformer (inga bibliotek). 26 små kuber; ett drag animeras genom att lagrets
// kuber vrids, och när vridningen är klar byts färgerna och vridningen nollas.
// Kameran visar U, F och R (vy 'ner' visar D, F och R). Dra i kuben för att titta runt och trycka på bitar
// på baksidan; kuben stannar där tills barnet trycker "Rätt vy". Dragen räknas alltid från kuben (F = grön
// mittbit i början), inte från kameran.

export interface Anim { drag: Drag; ms: number; id: number }

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** CSS-vridningen för ett drag. CSS har y nedåt, så x- och z-vinklarna byter tecken. */
function cssRot(d: Drag, del = 1) {
  const a = dragAxel(d);
  const g = a.grader * del;
  return a.axis === 0 ? `rotateX(${-g}deg)` : a.axis === 1 ? `rotateY(${g}deg)` : `rotateZ(${-g}deg)`;
}
const iLagret = (pos: Vec, d: Drag) => { const a = dragAxel(d); return a.layer === null || pos[a.axis] === a.layer; };

const YTOR: [Vec, string][] = [
  [[1, 0, 0], 'rotateY(90deg)'], [[-1, 0, 0], 'rotateY(-90deg)'], [[0, 1, 0], 'rotateX(90deg)'],
  [[0, -1, 0], 'rotateX(-90deg)'], [[0, 0, 1], ''], [[0, 0, -1], 'rotateY(180deg)'],
];
const SIDBOKSTAV = ['U', 'R', 'F', 'D', 'L', 'B'];

export interface Kub3DProps {
  kub: Kub;
  anim?: Anim | null;
  onAnimEnd?: () => void;
  vy?: 'upp' | 'ner';
  /** Kantlängd för en liten kub i px. */
  s?: number;
  onTryck?: (plats: number) => void;
  /** Klistermärken som lyser. */
  markera?: number[];
  /** Klistermärken som barnet har tryckt fel på. */
  fel?: number[];
  /** Bokstäverna U, F, R … på mittbitarna. */
  etiketter?: boolean;
  /** Tona ner allt som inte lyser. */
  tona?: boolean;
  label: string;
}

export function Kub3D({ kub, anim, onAnimEnd, vy = 'upp', s = 46, onTryck, markera, fel, etiketter, tona, label }: Kub3DProps) {
  const [go, setGo] = useState(false);
  const [orbit, setOrbit] = useState({ x: 0, y: 0, fjader: false });
  const orbitRef = useRef(orbit);
  orbitRef.current = orbit;
  const slut = useRef(onAnimEnd);
  slut.current = onAnimEnd;
  const drog = useRef(false);

  useEffect(() => {
    if (!anim) return;
    setGo(false);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setGo(true)); });
    const t = window.setTimeout(() => slut.current?.(), anim.ms + 40);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
  }, [anim?.id]);

  function down(e: PointerEvent) {
    const x0 = e.clientX, y0 = e.clientY;
    const o0 = orbitRef.current;
    drog.current = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!drog.current && Math.hypot(dx, dy) < 6) return;
      drog.current = true;
      // Runt hela varvet åt sidan, och upp eller ner så att toppen och botten syns.
      setOrbit({ x: o0.x + dx * 0.7, y: Math.max(-115, Math.min(115, o0.y - dy * 0.7)), fjader: false });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      // Klicket som kommer efter en dragning ska inte räknas som ett tryck på en bit.
      window.setTimeout(() => { drog.current = false; }, 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  const rx = (vy === 'upp' ? -27 : 27) + orbit.y;
  const ry = -38 + orbit.x;
  const mark = new Set(markera ?? []);
  const fela = new Set(fel ?? []);
  const vriden = orbit.x !== 0 || orbit.y !== 0;
  // Närmaste "hela varv" tillbaka, så att kuben inte snurrar flera varv på vägen hem.
  const hem = () => {
    setOrbit({ x: ((orbit.x % 360) + 540) % 360 - 180, y: orbit.y, fjader: false });
    requestAnimationFrame(() => requestAnimationFrame(() => setOrbit({ x: 0, y: 0, fjader: true })));
  };

  return (
    <div class="kub3d-ram">
    <div class={`kub3d${onTryck ? ' tryckbar' : ''}`} style={{ '--s': `${s}px`, width: `${s * 4.2}px`, height: `${s * 4.2}px` }}
      role="img" aria-label={label} onPointerDown={down}>
      <div class="kub3d-kub" style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg)`, transition: orbit.fjader ? 'transform 450ms ease-out' : 'none' }}>
        {BITAR.map((b) => {
          const rör = !!anim && iLagret(b.pos, anim.drag);
          const t = `${rör ? `${cssRot(anim!.drag, go ? 1 : 0)} ` : ''}translate3d(${b.pos[0] * s}px, ${-b.pos[1] * s}px, ${b.pos[2] * s}px)`;
          return (
            <div key={b.pos.join(',')} class="kub3d-bit" style={{ transform: t, transition: rör && go ? `transform ${anim!.ms}ms ease-in-out` : 'none' }}>
              {YTOR.map(([n, r]) => {
                const yttre = b.pos[0] * n[0] + b.pos[1] * n[1] + b.pos[2] * n[2] === 1;
                const p = yttre ? platsVid(b.pos, n) : -1;
                return (
                  <div key={r} class="kub3d-yta" style={{ transform: `${r} translateZ(${s / 2}px)` }}>
                    {p >= 0 && (
                      <div data-p={p} class={`kub3d-dekal f-${kub[p]}${mark.has(p) ? ' lyser' : tona ? ' tona' : ''}${fela.has(p) ? ' fel' : ''}`}
                        onClick={onTryck ? () => { if (!drog.current) onTryck(p); } : undefined}>
                        {etiketter && p % 9 === 4 && <span class="kub3d-bokstav">{SIDBOKSTAV[Math.floor(p / 9)]}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    {vriden && <button type="button" class="btn small kub3d-hem" onClick={hem}>↺ Rätt vy</button>}
    </div>
  );
}

// ---------- spelaren: en kö av drag som animeras ett i taget ----------

interface Item { drag: Drag; ms: number; then?: () => void }

export interface Spelare {
  /** Kuben som visas (före dragen som animeras). */
  visad: Kub;
  anim: Anim | null;
  /** Kuben när alla drag i kön är gjorda. */
  logisk: () => Kub;
  upptagen: boolean;
  /** Lägger drag i kön. varje(i) anropas när drag i är klart, then när alla är klara. */
  spela: (drag: Drag[], o?: { ms?: number; then?: () => void; varje?: (i: number) => void }) => void;
  /** Hoppar direkt till ett läge (tömmer kön). */
  satt: (k: Kub) => void;
  slut: () => void;
}

export function useSpelare(start: Kub, ms = 360): Spelare {
  const [visad, setVisad] = useState(start);
  const [anim, setAnim] = useState<Anim | null>(null);
  const [upptagen, setUpptagen] = useState(false);
  const ko = useRef<Item[]>([]);
  const cur = useRef<Item | null>(null);
  const logisk = useRef(start);
  const visadRef = useRef(start);
  const idn = useRef(0);

  const visa_ = (k: Kub) => { visadRef.current = k; setVisad(k); };
  function nasta() {
    while (!cur.current) {
      const n = ko.current.shift();
      if (!n) { setUpptagen(false); return; }
      if (n.ms <= 0) { visa_(vrid(visadRef.current, n.drag)); n.then?.(); continue; }
      cur.current = n;
      setAnim({ drag: n.drag, ms: n.ms, id: ++idn.current });
    }
  }
  const slut = () => {
    const n = cur.current;
    if (!n) return;
    cur.current = null;
    visa_(vrid(visadRef.current, n.drag));
    setAnim(null);
    n.then?.();
    nasta();
  };
  const spela: Spelare['spela'] = (drag, o = {}) => {
    const fart = reduced() ? 0 : (o.ms ?? ms);
    if (drag.length === 0) { o.then?.(); return; }
    drag.forEach((d, i) => {
      logisk.current = vrid(logisk.current, d);
      const sist = i === drag.length - 1;
      ko.current.push({ drag: d, ms: fart && dragVarv(d) === 2 ? fart * 1.5 : fart, then: () => { o.varje?.(i); if (sist) o.then?.(); } });
    });
    setUpptagen(true);
    nasta();
  };
  const satt = (k: Kub) => {
    ko.current = [];
    cur.current = null;
    logisk.current = k;
    visa_(k);
    setAnim(null);
    setUpptagen(false);
  };
  return { visad, anim, logisk: () => logisk.current, upptagen, spela, satt, slut };
}

// ---------- knapparna ----------

const NAMN: Record<string, string> = { U: 'Upp', D: 'Ner', R: 'Höger', L: 'Vänster', F: 'Fram', B: 'Bak' };
const ORDNING = ['U', 'D', 'R', 'L', 'F', 'B'];

/** Knappar för de tolv dragen (och att vrida hela kuben). */
export function DragKnappar({ onDrag, disabled, rotera, lyser }: { onDrag: (d: Drag) => void; disabled?: boolean; rotera?: boolean; lyser?: Drag }) {
  const knapp = (d: Drag) => (
    <button key={d} type="button" class={`kub-knapp${d.endsWith("'") ? ' prim' : ''}${lyser === d ? ' lyser' : ''}`} disabled={disabled} onClick={() => onDrag(d)}
      aria-label={`${visa(d)}: ${NAMN[d[0]]}${d.endsWith("'") ? ', åt andra hållet' : ''}`}>
      <b>{visa(d)}</b><small>{NAMN[d[0]]}</small>
    </button>
  );
  return (
    <div class="kub-knappar" role="group" aria-label="Vrid kuben">
      <div class="kub-knapprad">{ORDNING.map((f) => knapp(f))}</div>
      <div class="kub-knapprad">{ORDNING.map((f) => knapp(`${f}'`))}</div>
      {rotera && (
        <div class="kub-knapprad hela">
          <button type="button" class="kub-knapp hela" disabled={disabled} onClick={() => onDrag("y'")} aria-label="Vrid hela kuben åt vänster">↶ <small>Hela kuben</small></button>
          <button type="button" class="kub-knapp hela" disabled={disabled} onClick={() => onDrag('y')} aria-label="Vrid hela kuben åt höger"><small>Hela kuben</small> ↷</button>
        </div>
      )}
    </div>
  );
}

/** Ett kubprogram som brickor. klara = hur många som är gjorda; dold = visa ? för de som inte är gjorda. */
export function DragRad({ alg, klara = -1, dold, grupp, label = 'Kubprogrammet' }: { alg: Drag[]; klara?: number; dold?: boolean; grupp?: number; label?: string }) {
  return (
    <div class="kub-prog" role="list" aria-label={label}>
      {alg.map((d, i) => (
        <span key={i} role="listitem" class={`kub-bricka${i < klara ? ' klar' : ''}${i === klara ? ' nu' : ''}${grupp && i > 0 && i % grupp === 0 ? ' ny-grupp' : ''}`}>
          {dold && i >= klara ? '?' : visa(d)}
        </span>
      ))}
    </div>
  );
}

// ---------- bilder till lektionerna ----------

/** En kub som spelar upp ett kubprogram, ett drag i taget eller allt på en gång. */
export function KubFilm({ alg, setup, fran = LOST, vy, etiketter, text, grupp }: { alg: string; setup?: string; fran?: Kub; vy?: 'upp' | 'ner'; etiketter?: boolean; text?: string; grupp?: number }) {
  const drag = parse(alg);
  const start = setup ? vrid(fran, parse(setup)) : fran;
  const sp = useSpelare(start, 520);
  const [klara, setKlara] = useState(0);
  const omStart = () => { sp.satt(start); setKlara(0); };
  const allt = () => { sp.satt(start); setKlara(0); sp.spela(drag, { varje: (i) => setKlara(i + 1) }); };
  const ett = () => {
    if (sp.upptagen) return;
    if (klara >= drag.length) { omStart(); return; }
    const i = klara;
    sp.spela([drag[i]], { then: () => setKlara(i + 1) });
  };
  return (
    <div class="kub-film">
      <Kub3D kub={sp.visad} anim={sp.anim} onAnimEnd={sp.slut} vy={vy} etiketter={etiketter} s={40} label={text ?? `En kub som visar ${alg}`} />
      <DragRad alg={drag} klara={klara} grupp={grupp} />
      <div class="row center-row">
        <button type="button" class="btn small" onClick={allt}>▶ Spela</button>
        <button type="button" class="btn small" onClick={ett} disabled={sp.upptagen}>{klara >= drag.length ? '↺ Igen' : '⏭ Ett drag'}</button>
        {klara > 0 && klara < drag.length && <button type="button" class="btn small" onClick={omStart}>↺ Börja om</button>}
      </div>
      {text && <p class="lb-caption">{text}</p>}
    </div>
  );
}

/** En kub att leka med: alla knappar, ångra och börja om. */
export function KubLek({ setup, etiketter = true, rotera }: { setup?: string; etiketter?: boolean; rotera?: boolean }) {
  const start = setup ? vrid(LOST, parse(setup)) : LOST;
  const sp = useSpelare(start);
  const [gjorda, setGjorda] = useState<Drag[]>([]);
  return (
    <div class="kub-film">
      <Kub3D kub={sp.visad} anim={sp.anim} onAnimEnd={sp.slut} etiketter={etiketter} s={40} label="En kub att prova dragen på" />
      <DragKnappar rotera={rotera} onDrag={(d) => { setGjorda((g) => [...g, d]); sp.spela([d]); }} />
      <div class="row center-row">
        <button type="button" class="btn small" disabled={!gjorda.length} onClick={() => { const d = gjorda[gjorda.length - 1]; setGjorda((g) => g.slice(0, -1)); sp.spela([invDrag(d)]); }}>↶ Ångra</button>
        <button type="button" class="btn small" disabled={!gjorda.length} onClick={() => { setGjorda([]); sp.satt(start); }}>↺ Börja om</button>
      </div>
    </div>
  );
}

/** Gula sidan ovanifrån, med kanterna på sidorna runt om (för gula stegen). */
export function ToppBild({ kub, text }: { kub: Kub; text?: string }) {
  const c = 22, g = 3;
  const celler = PLATSER.map((p, i) => ({ p, i })).filter(({ p }) => p.pos[1] === 1).map(({ p, i }) => {
    const x = p.pos[0] + p.n[0], z = p.pos[2] + p.n[2];
    const sida = p.sida !== 'U';
    // Sidornas klistermärken ritas som smala remsor ytterst.
    const w = sida && p.n[0] !== 0 ? c * 0.45 : c, h = sida && p.n[2] !== 0 ? c * 0.45 : c;
    const cx = (x + 2) * (c + g) + c / 2 + (p.n[0] < 0 ? c * 0.55 / 2 : p.n[0] > 0 ? -c * 0.55 / 2 : 0);
    const cy = (z + 2) * (c + g) + c / 2 + (p.n[2] < 0 ? c * 0.55 / 2 : p.n[2] > 0 ? -c * 0.55 / 2 : 0);
    return <rect key={i} x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={4} class={`kub-topp f-${kub[i]}`} />;
  });
  const W = 5 * (c + g);
  return (
    <figure class="kub-toppbild">
      <svg viewBox={`0 0 ${W} ${W}`} width={W * 1.4} role="img" aria-label={text ?? 'Gula sidan ovanifrån'}>
        <rect x={c + g - 3} y={c + g - 3} width={3 * (c + g) + 3} height={3 * (c + g) + 3} rx={6} class="kub-topp-kropp" />
        {celler}
      </svg>
      {text && <figcaption class="lb-caption">{text}</figcaption>}
    </figure>
  );
}
