import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameModule, QuestionViewProps } from '../../platform/rpg/types';
import { ATOM_NAME, checkBug, diagnoseProg, explainRobot, hintRobot, LETTERS, ROBOT_ERR } from './check';
import type { Atom, Cmd, Explained, Loop, Pos, Prog, RobotGame, RobotQ, World } from './types';
import { atomsOf, blockAt, isLoop, replaceAt, run, size, solves, type State, type Trace } from './world';

// En robotfråga. Samma flöde som de andra motorerna: öppen → (fel) rätta → klar, och bara första svaret räknas.
// bygg: barnet bygger programmet och trycker Kör; vart: väljer rutan där roboten hamnar;
// bugg: trycker på blocket som är fel (och får testköra först); lucka: väljer det som fattas.

type Phase = 'open' | 'fixing' | 'done';

const S = 48;
const GLYPH: Record<Atom, string> = { U: '⬆', R: '➡', D: '⬇', L: '⬅', F: '⬆', V: '↰', H: '↱' };
const SHORT: Record<Atom, string> = { U: '', R: '', D: '', L: '', F: 'Fram', V: 'Vänster', H: 'Höger' };
const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** Robothuvudet sett uppifrån; nosen pekar åt hållet den tittar. */
function Robot({ s, deg, crashed }: { s: State; deg: number; crashed: boolean }) {
  const cx = s.x * S + S / 2, cy = s.y * S + S / 2;
  return (
    <g class={`rb-robot${crashed ? ' crashed' : ''}`} style={{ transform: `translate(${cx}px, ${cy}px) rotate(${deg}deg)` }}>
      <path d={`M-7 -16 L0 -23 L7 -16 Z`} class="rb-nose" />
      <rect x={-15} y={-15} width={30} height={30} rx={8} class="rb-body" />
      <circle cx={-6} cy={-6} r={3.6} class="rb-eye" />
      <circle cx={6} cy={-6} r={3.6} class="rb-eye" />
      <rect x={-7} y={5} width={14} height={4} rx={2} class="rb-mouth" />
    </g>
  );
}

function Rock({ p }: { p: Pos }) {
  const x = p[0] * S, y = p[1] * S;
  return <path class="rb-rock" d={`M${x + 8} ${y + 36} L${x + 12} ${y + 16} L${x + 22} ${y + 9} L${x + 35} ${y + 12} L${x + 41} ${y + 27} L${x + 37} ${y + 39} L${x + 16} ${y + 41} Z`} />;
}

const Emoji = ({ p, e, cls = '' }: { p: Pos; e: string; cls?: string }) => (
  <text x={p[0] * S + S / 2} y={p[1] * S + S / 2 + 1} class={`rb-emoji ${cls}`} text-anchor="middle" dominant-baseline="central">{e}</text>
);

/** Rutnätet med roboten. frame = hur långt körningen har kommit (null = roboten står vid start). */
function Grid({ world, trace, frame, spots, wrongSpots, onSpot, hitSpot }: {
  world: World; trace: Trace | null; frame: number; spots?: Pos[]; wrongSpots?: number[]; onSpot?: (i: number) => void; hitSpot?: number;
}) {
  const states = trace ? trace.states.slice(0, frame + 1) : [{ x: world.start[0], y: world.start[1], dir: world.dir }];
  const now = states[states.length - 1];
  const finished = !!trace && frame >= trace.states.length - 1;
  const crashed = finished && !!trace!.crash;
  const picked = new Set(trace ? trace.gems.filter((g) => states.some((s) => s.x === g[0] && s.y === g[1])).map((g) => `${g[0]},${g[1]}`) : []);
  // Vridningen räknas ihop, så att roboten svänger kortaste vägen (inte ett helt varv baklänges).
  const turn = useRef({ dir: world.dir as number, deg: world.dir * 90 });
  if (now.dir !== turn.current.dir) {
    const d = (now.dir - turn.current.dir + 4) % 4;
    turn.current = { dir: now.dir, deg: turn.current.deg + (d === 3 ? -90 : d * 90) };
  }
  const label = `Rutnät ${world.w} gånger ${world.h}. Roboten står i kolumn ${world.start[0] + 1}, rad ${world.start[1] + 1}.`;
  const crashAt = crashed ? [(now.x + trace!.crash![0]) / 2, (now.y + trace!.crash![1]) / 2] as Pos : null;
  return (
    <svg class="rb-grid" viewBox={`-2 -2 ${world.w * S + 4} ${world.h * S + 4}`} role="img" aria-label={label}
      style={{ maxWidth: `${Math.min(world.w * 60, 420)}px` }}>
      {Array.from({ length: world.h }, (_, y) => Array.from({ length: world.w }, (_, x) => (
        <rect key={`${x}-${y}`} x={x * S + 1} y={y * S + 1} width={S - 2} height={S - 2} rx={6} class={(x + y) % 2 ? 'rb-cell alt' : 'rb-cell'} />
      )))}
      {states.slice(1).map((s, i) => <circle key={i} cx={s.x * S + S / 2} cy={s.y * S + S / 2} r={5} class="rb-trail" />)}
      {world.rocks.map((p) => <Rock key={`r${p}`} p={p} />)}
      {world.goal && <Emoji p={world.goal} e="🔋" />}
      {world.gems.map((p) => <Emoji key={`g${p}`} p={p} e="💎" cls={picked.has(`${p[0]},${p[1]}`) ? 'picked' : ''} />)}
      {spots?.map((p, i) => (
        <g key={`s${i}`} class={`rb-spot${wrongSpots?.includes(i) ? ' wrong' : ''}${hitSpot === i ? ' hit' : ''}`} onClick={onSpot && !wrongSpots?.includes(i) ? () => onSpot(i) : undefined}>
          <circle cx={p[0] * S + S / 2} cy={p[1] * S + S / 2} r={15} />
          <text x={p[0] * S + S / 2} y={p[1] * S + S / 2 + 1} text-anchor="middle" dominant-baseline="central">{LETTERS[i]}</text>
        </g>
      ))}
      <Robot s={now} deg={turn.current.deg} crashed={crashed} />
      {crashAt && <Emoji p={crashAt} e="💥" cls="rb-boom" />}
    </svg>
  );
}

/** Ett block i programmet. */
function AtomChip({ a, cls = '', onClick, label, disabled }: { a: Atom; cls?: string; onClick?: () => void; label?: string; disabled?: boolean }) {
  const body = <><span class="rb-glyph" aria-hidden="true">{GLYPH[a]}</span>{SHORT[a] && <span class="rb-word">{SHORT[a]}</span>}</>;
  return onClick
    ? <button type="button" class={`rb-chip a-${a} ${cls}`} onClick={onClick} disabled={disabled} aria-label={label ?? ATOM_NAME[a]}>{body}</button>
    : <span class={`rb-chip a-${a} ${cls}`} role="img" aria-label={ATOM_NAME[a]}>{body}</span>;
}

interface ProgOpts {
  /** Blocket som körs just nu. */
  active?: string;
  /** Tryck på ett block (bugg: välj; bygg: ta bort). */
  onTap?: (id: string) => void;
  tapLabel?: (id: string, c: Cmd) => string;
  marks?: Record<string, string>;
  /** lucka: hålets id och det som står där när frågan är klar. */
  hole?: string;
  fill?: Atom | number;
  /** bygg: loopen där nästa block hamnar ('' = överst), och ändra varv / öppna en loop. */
  cursor?: string;
  onRep?: (id: string, d: number) => void;
  onOpen?: (id: string) => void;
  disabled?: boolean;
}

function ProgList({ prog, prefix, o }: { prog: Prog; prefix: string; o: ProgOpts }) {
  return (
    <>
      {prog.map((c, i) => {
        const id = `${prefix}${i}`;
        const cls = `${o.active === id ? 'active' : ''} ${o.marks?.[id] ?? ''}`;
        if (isLoop(c)) {
          const isHole = o.hole === id;
          const rep = isHole ? (o.fill ?? '?') : c.rep;
          return (
            <span key={id} class={`rb-loop ${cls}${o.cursor === id ? ' open' : ''}`}>
              <span class="rb-loop-head">
                {o.onTap && !o.onRep
                  ? <button type="button" class="rb-loop-btn" disabled={o.disabled} onClick={() => o.onTap!(id)} aria-label={o.tapLabel?.(id, c) ?? `Upprepa ${c.rep} gånger`}>🔁 {rep} ×</button>
                  : <span class={isHole && o.fill === undefined ? 'rb-hole' : ''}>🔁 {rep} ×</span>}
                {o.onRep && !o.disabled && (
                  <span class="rb-rep">
                    <button type="button" aria-label="Ett varv färre" onClick={() => o.onRep!(id, -1)} disabled={c.rep <= 2}>−</button>
                    <button type="button" aria-label="Ett varv till" onClick={() => o.onRep!(id, 1)} disabled={c.rep >= 9}>+</button>
                  </span>
                )}
              </span>
              <span class="rb-loop-body" onClick={o.onOpen && !o.disabled ? (e) => { e.stopPropagation(); o.onOpen!(id); } : undefined}>
                <ProgList prog={c.body} prefix={`${id}.`} o={o} />
                {o.cursor === id && <span class="rb-caret" aria-hidden="true" />}
                {c.body.length === 0 && o.cursor !== id && <span class="rb-empty">tom</span>}
              </span>
              {o.onTap && o.onRep && !o.disabled && <button type="button" class="rb-x" aria-label="Ta bort loopen" onClick={() => o.onTap!(id)}>✕</button>}
            </span>
          );
        }
        if (o.hole === id) {
          return o.fill === undefined
            ? <span key={id} class="rb-chip rb-hole" aria-label="Det som fattas">?</span>
            : <AtomChip key={id} a={o.fill as Atom} cls={`filled ${cls}`} />;
        }
        return <AtomChip key={id} a={c} cls={cls} onClick={o.onTap ? () => o.onTap!(id) : undefined} disabled={o.disabled} label={o.tapLabel?.(id, c)} />;
      })}
    </>
  );
}

function ProgView({ prog, o = {}, label = 'Programmet' }: { prog: Prog; o?: ProgOpts; label?: string }) {
  return (
    <div class={`rb-prog${o.cursor === '' ? ' open' : ''}`} role="group" aria-label={label}>
      <span class="rb-start" aria-hidden="true">▶</span>
      <ProgList prog={prog} prefix="" o={o} />
      {o.cursor === '' && <span class="rb-caret" aria-hidden="true" />}
      {prog.length === 0 && o.cursor !== '' && <span class="rb-empty">Tryck på blocken nedanför</span>}
    </div>
  );
}

/** Spelar upp en körning, ett block i taget. */
function usePlayer() {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [frame, setFrame] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const done = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const play = (t: Trace, then?: () => void) => {
    clearTimeout(timer.current);
    setTrace(t);
    done.current = then;
    if (reduced()) { setFrame(t.states.length - 1); then?.(); return; }
    setFrame(0);
    let f = 0;
    const tick = () => {
      f++;
      setFrame(f);
      if (f < t.states.length - 1) timer.current = window.setTimeout(tick, 330);
      else timer.current = window.setTimeout(() => done.current?.(), 250);
    };
    timer.current = window.setTimeout(tick, 280);
  };
  const reset = () => { clearTimeout(timer.current); setTrace(null); setFrame(0); };
  const playing = !!trace && frame < trace.states.length - 1;
  const active = trace && frame > 0 ? trace.states[frame].block : undefined;
  return { trace, frame, play, reset, playing, active };
}

// ---------- bygg: redigera programmet ----------

/** Lägger till ett block i loopen cursor ('' = överst). */
function addAt(prog: Prog, cursor: string, c: Cmd): Prog {
  if (cursor === '') return [...prog, c];
  const l = blockAt(prog, cursor) as Loop;
  return replaceAt(prog, cursor, { rep: l.rep, body: [...l.body, c] });
}

const parentOf = (id: string) => (id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : '');
const loopDepth = (cursor: string) => (cursor === '' ? 0 : cursor.split('.').length);

export function makeRobotView<Q extends RobotQ>(g: RobotGame<Q>) {
  return function RobotView({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
    const q = raw as Q;
    const [phase, setPhase] = useState<Phase>('open');
    const [tries, setTries] = useState(0);
    const [err, setErr] = useState<Explained | null>(null);
    const [warn, setWarn] = useState('');
    const [prog, setProg] = useState<Prog>([]);
    const [cursor, setCursor] = useState('');
    const [wrong, setWrong] = useState<string[]>([]);
    const [shown, setShown] = useState(false);
    const [picked, setPicked] = useState<number | string | null>(null);
    const t0 = useRef(performance.now());
    const answered = useRef(false);
    const nextRef = useRef<HTMLButtonElement>(null);
    const player = usePlayer();
    const done = phase === 'done';

    useEffect(() => { if (done) nextRef.current?.focus({ preventScroll: true }); }, [done]);

    function first(correct: boolean, tag?: string) {
      if (answered.current) return;
      answered.current = true;
      onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
    }
    function miss(tag: string) {
      setPhase('fixing');
      setTries((n) => n + 1);
      setErr(explainRobot(tag, q));
    }

    // ----- bygg -----
    const edit = (next: Prog, cur = cursor) => { setProg(next); setCursor(cur); setWarn(''); if (player.trace) player.reset(); };
    function runBuilt() {
      if (done || player.playing) return;
      if (prog.length === 0) { setWarn('Lägg till block först.'); return; }
      if (q.maxBlocks && size(prog) > q.maxBlocks) { setWarn(`För många block: ${size(prog)}. Det får vara högst ${q.maxBlocks}. Kan en loop hjälpa?`); return; }
      const t = run(q.world, prog);
      const ok = solves(q.world, prog, t);
      const tag = ok ? undefined : diagnoseProg(q, prog);
      first(ok, tag);
      setErr(null);
      player.play(t, () => {
        if (ok) { setPhase('done'); return; }
        miss(tag!);
      });
    }

    // ----- vart, bugg och lucka -----
    function pickSpot(i: number) {
      if (done || wrong.includes(String(i))) return;
      const s = q.spots![i];
      first(!s.err, s.err);
      if (!s.err) { setPicked(i); setPhase('done'); player.play(run(q.world, q.prog!)); return; }
      setWrong((w) => [...w, String(i)]);
      miss(s.err);
    }
    function pickBlock(id: string) {
      if (done || player.playing || wrong.includes(id)) return;
      const tag = checkBug(q, id);
      first(!tag, tag);
      if (!tag) { setPicked(id); setPhase('done'); player.play(run(q.world, q.solution!)); return; }
      setWrong((w) => [...w, id]);
      miss(tag);
    }
    function pickFill(i: number) {
      if (done || wrong.includes(String(i))) return;
      const f = q.fills![i];
      first(!f.err, f.err);
      if (!f.err) {
        setPicked(i); setPhase('done');
        const c = blockAt(q.prog!, q.hole!);
        player.play(run(q.world, replaceAt(q.prog!, q.hole!, isLoop(c) ? { rep: f.fill as number, body: c.body } : (f.fill as Atom))));
        return;
      }
      setWrong((w) => [...w, String(i)]);
      miss(f.err);
    }

    const next = () => onDone(tries > 0 ? (shown ? 'shown' : 'self') : undefined);
    const feedback = done ? (tries > 0 ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
    const task = q.kind === 'bygg' ? 'Ändra programmet och tryck Kör igen.' : q.kind === 'vart' ? 'Välj en annan ruta.' : q.kind === 'bugg' ? 'Leta vidare!' : 'Välj ett annat alternativ.';
    const marks: Record<string, string> = Object.fromEntries(wrong.map((id) => [id, 'wrong']));
    if (done && q.kind === 'bugg' && typeof picked === 'string') marks[picked] = 'hit';
    const shownProg = q.kind === 'bugg' && done ? q.solution! : q.prog;
    const solutionText = (() => {
      if (q.kind === 'vart') return `Roboten hamnar på ${LETTERS[picked as number]}.`;
      if (q.kind === 'bugg') return 'Där var felet! Så här blir programmet när blocket är rättat.';
      if (q.kind === 'lucka') return 'Med det kommer roboten fram till 🔋.';
      return shown ? 'Så här kan programmet se ut. Det finns ofta flera sätt!' : 'Roboten kom fram! Ditt program fungerar.';
    })();

    return (
      <div class="kq robot">
        {hint && <p class="hint-tag">💡 {g.hint?.(q) ?? hintRobot(q)}</p>}
        <p class="drill-prompt">{q.prompt}</p>
        {q.maxBlocks && !done && <p class="rb-limit">Högst <b>{q.maxBlocks}</b> block{q.kind === 'bygg' && <> · Du har använt <b class={size(prog) > q.maxBlocks ? 'over' : ''}>{size(prog)}</b></>}</p>}

        <Grid world={q.world} trace={player.trace} frame={player.frame}
          spots={q.kind === 'vart' ? q.spots!.map((s) => s.at) : undefined}
          wrongSpots={q.kind === 'vart' ? wrong.map(Number) : undefined}
          hitSpot={q.kind === 'vart' && done ? (picked as number) : undefined}
          onSpot={q.kind === 'vart' && !done ? pickSpot : undefined} />

        {q.kind === 'bygg' && (
          <>
            <ProgView prog={prog} label="Ditt program" o={{
              active: player.active, cursor: done ? undefined : cursor, disabled: done || player.playing,
              // Ett borttaget block flyttar blocken efter det, så den öppna loopen behålls bara om blocket låg i den.
              onTap: (id) => edit(replaceAt(prog, id, null), cursor === '' || id.startsWith(`${cursor}.`) ? cursor : ''),
              tapLabel: (_id, c) => `Ta bort ${isLoop(c) ? 'loopen' : ATOM_NAME[c]}`,
              onRep: (id, d) => { const l = blockAt(prog, id) as Loop; edit(replaceAt(prog, id, { rep: l.rep + d, body: l.body })); },
              onOpen: (id) => setCursor(id),
            }} />
            {!done && (
              <div class="rb-palette" role="group" aria-label="Block">
                {atomsOf(q.palette).map((a) => <AtomChip key={a} a={a} cls="big" onClick={() => edit(addAt(prog, cursor, a))} label={`Lägg till ${ATOM_NAME[a]}`} />)}
                {q.loops && loopDepth(cursor) < 2 && <button type="button" class="rb-chip big rb-add-loop" onClick={() => { const at = cursor === '' ? prog.length : (blockAt(prog, cursor) as Loop).body.length; edit(addAt(prog, cursor, { rep: 2, body: [] }), cursor === '' ? String(at) : `${cursor}.${at}`); }}>🔁 Loop</button>}
              </div>
            )}
            {!done && (
              <div class="row center-row rb-actions">
                {cursor !== '' && <button type="button" class="btn small" onClick={() => setCursor(parentOf(cursor))}>Klar med loopen ⤴</button>}
                <button type="button" class="btn small" disabled={prog.length === 0 || player.playing} onClick={() => edit([], '')}>Töm</button>
                <button type="button" class="btn primary" disabled={player.playing} onClick={runBuilt}>▶ Kör</button>
              </div>
            )}
            {!done && tries >= 3 && !shown && q.solution && (
              <div class="row center-row"><button type="button" class="link" onClick={() => { setShown(true); edit(q.solution!, ''); }}>Visa en lösning</button></div>
            )}
          </>
        )}

        {q.kind !== 'bygg' && shownProg && (
          <ProgView prog={shownProg} label={q.kind === 'bugg' ? 'Programmet – tryck på blocket som är fel' : 'Programmet'} o={{
            active: player.active, marks, hole: q.kind === 'lucka' ? q.hole : undefined,
            fill: q.kind === 'lucka' && done ? q.fills![picked as number].fill : undefined,
            onTap: q.kind === 'bugg' && !done ? pickBlock : undefined, disabled: player.playing,
            tapLabel: (_id, c) => (isLoop(c) ? `Loopen, ${c.rep} gånger` : ATOM_NAME[c]),
          }} />
        )}

        {q.kind === 'bugg' && !done && (
          <div class="row center-row"><button type="button" class="btn small" disabled={player.playing} onClick={() => player.play(run(q.world, q.prog!))}>▶ Testkör</button></div>
        )}

        {q.kind === 'vart' && !done && (
          <div class="drill-choices words" role="group" aria-label="Välj ruta">
            {q.spots!.map((_, i) => <button key={i} type="button" class={`btn drill-choice${wrong.includes(String(i)) ? ' wrong' : ''}`} disabled={wrong.includes(String(i))} onClick={() => pickSpot(i)}>{LETTERS[i]}</button>)}
          </div>
        )}

        {q.kind === 'lucka' && !done && (
          <div class="drill-choices words rb-fills" role="group" aria-label="Välj det som fattas">
            {q.fills!.map((f, i) => {
              const off = wrong.includes(String(i));
              return typeof f.fill === 'number'
                ? <button key={i} type="button" class={`btn drill-choice${off ? ' wrong' : ''}`} disabled={off} onClick={() => pickFill(i)}>{f.fill}</button>
                : <AtomChip key={i} a={f.fill} cls={`big${off ? ' wrong' : ''}`} onClick={off ? undefined : () => pickFill(i)} />;
            })}
          </div>
        )}

        {warn && <p class="warn-line" role="alert">{warn}</p>}
        <p class={`feedback ${done ? 'ok' : 'bad'}`} role="status">{player.playing ? '' : feedback}</p>
        {phase === 'fixing' && err && !player.playing && (
          <div class="errcard shake" key={tries}>
            <div class="err-title">{err.title}</div>
            <div class="err-text">{err.text}</div>
            <div class="err-task">{task}</div>
          </div>
        )}
        {done && <p class="explain">{solutionText}</p>}
        {done && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
      </div>
    );
  };
}

/** Gör ett robotspel till en frågefabrik för plattformen. */
export function robotModule<Q extends RobotQ>(g: RobotGame<Q>): GameModule {
  return {
    id: g.id,
    makeQuestion: (spec, rng, ctx) => g.make(spec, rng, ctx),
    skillOf: (q) => (q as Q).skill,
    specsForSkill: (s) => g.specsForSkill(s),
    errLabel: (tag) => g.errLabels?.[tag] ?? ROBOT_ERR[tag],
    View: makeRobotView(g),
  };
}

