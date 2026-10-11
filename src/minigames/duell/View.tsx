import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HeroFigure } from '../../shell/HeroFigure';
import { duelLoadout, MOVES, OPPONENTS } from '../../platform/rpg/arena';
import { newDuel, nextFoe, press, step, windPart, type Duel, type Input } from './sim';

// Bossduellens skärm. Röda banor visar var slaget landar; när de är helt fyllda slår det.
// Tangenter: ←/→ (A/D) hoppa, ↓ (S) blockera, ↑/mellanslag (W) slå, E superslag.
// Pekskärm: knapparna, eller svep vänster/höger/ner och tryck för att slå.

export interface DuelWin { foe: number; flawless: boolean }

const KEYS: Record<string, Input> = {
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ArrowDown: 'block', s: 'block', S: 'block', ArrowUp: 'attack', w: 'attack', W: 'attack', ' ': 'attack', e: 'special', E: 'special',
};

type Ui = 'intro' | 'fight' | 'between' | 'over';

export default function DuelGame({ hid, start, seed, onWin, onEnd }: {
  hid: string; start: number; seed: number;
  /** Sparar en vinst och returnerar bladen den gav. */
  onWin: (w: DuelWin) => number;
  onEnd: (beaten: number[]) => void;
}) {
  const duel = useMemo<Duel>(() => newDuel(duelLoadout(hid), start, seed), []);
  const [, setFrame] = useState(0);
  const [ui, setUi] = useState<Ui>('intro');
  const uiRef = useRef<Ui>('intro');
  const beaten = useRef<{ foe: number; blad: number }[]>([]);
  const touchStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const setUiBoth = (u: Ui) => { uiRef.current = u; setUi(u); };
  // Hjältefiguren ritas en gång (samma vnode = Preact hoppar över den varje bildruta).
  const figure = useMemo(() => <HeroFigure hid={hid} size={96} noPet />, []);

  useEffect(() => {
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (uiRef.current === 'fight') {
        step(duel, dt);
        if (duel.phase === 'won') {
          const blad = onWin({ foe: duel.foe.idx, flawless: duel.hitsTaken === 0 });
          beaten.current.push({ foe: duel.foe.idx, blad });
          setUiBoth(duel.foe.idx >= OPPONENTS.length - 1 ? 'over' : 'between');
        } else if (duel.phase === 'lost') setUiBoth('over');
      } else step(duel, dt);
      setFrame((n) => n + 1);
    };
    raf = requestAnimationFrame(frame);
    const hide = () => { if (document.hidden && uiRef.current === 'fight') setUiBoth('intro'); };
    document.addEventListener('visibilitychange', hide);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', hide); };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = KEYS[e.key];
      if (uiRef.current === 'fight' && k) { e.preventDefault(); if (!e.repeat) press(duel, k); }
      else if (e.key === 'Enter' || e.key === ' ') {
        if (uiRef.current === 'intro') { e.preventDefault(); setUiBoth('fight'); }
        else if (uiRef.current === 'between') { e.preventDefault(); goNext(); }
      }
    };
    addEventListener('keydown', down);
    return () => removeEventListener('keydown', down);
  }, []);

  function goNext() { nextFoe(duel); setUiBoth('intro'); }

  const onDown = (e: PointerEvent) => { if (uiRef.current === 'fight') touchStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
  const onUp = (e: PointerEvent) => {
    const t = touchStart.current;
    touchStart.current = null;
    if (!t || t.id !== e.pointerId || uiRef.current !== 'fight') return;
    const dx = e.clientX - t.x, dy = e.clientY - t.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) press(duel, dx < 0 ? 'left' : 'right');
    else if (dy > 30) press(duel, 'block');
    else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) press(duel, 'attack');
  };

  const d = duel, f = d.foe, h = d.hero, o = OPPONENTS[f.idx], lo = d.lo;
  const p = windPart(f);
  const fighting = ui === 'fight';
  const btn = (input: Input, label: string, cls = '') => (
    <button class={`btn duel-btn ${cls}`} disabled={!fighting} onPointerDown={(e) => { e.preventDefault(); press(d, input); }}>{label}</button>
  );

  return (
    <div class="duel">
      <div class="duel-hud">
        <div><small>Du</small><div class="hpbar"><div style={{ width: `${(h.hp / h.maxHp) * 100}%`, background: 'linear-gradient(90deg,#2f9e44,#69db7c)' }} /></div><small>❤️ {h.hp}/{h.maxHp}</small></div>
        <div><small>{o.icon} {o.name}</small><div class="hpbar"><div style={{ width: `${(f.hp / f.maxHp) * 100}%` }} /></div><small>{f.hp}/{f.maxHp}</small></div>
      </div>

      <div class={`duel-stage foe-${f.state}${h.block > 0 ? ' blocking' : ''}`} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { touchStart.current = null; }}>
        <div class="duel-lanes" aria-hidden="true">
          {f.lanes.map((on, i) => <div key={i} class={`duel-lane${on ? ' danger' : ''}`} style={{ '--p': on ? p : 0 }} />)}
        </div>
        <div key={`s${f.strikes}`} class="duel-foe">
          <span class="duel-foe-icon">{o.icon}</span>
          {f.state === 'open' && <span class="duel-dizzy">💫</span>}
        </div>
        {f.state === 'wind' && f.move && <div class="duel-move">{MOVES[f.move].name}</div>}
        <div class="duel-hero" style={{ transform: `translateX(${h.lane * 100}%)` }}>
          <div key={`h${h.swings}`} class={h.swings ? 'duel-swing' : ''}>{figure}</div>
          {h.block > 0 && <span class="duel-shield">🛡️</span>}
          {lo.pet && <span class="duel-pet">{lo.pet}</span>}
        </div>
        {d.fx.map((e) => (
          <span key={e.id} class={`duel-fx ${e.who}${e.big ? ' big' : ''}${e.kind === 'num' ? ' num' : ''}`}>{e.text}</span>
        ))}

        {ui === 'intro' && (
          <div class="storm-overlay">
            <h2>{o.icon} {o.name}</h2>
            <p>{o.tip}</p>
            <p class="small">När banorna blir <b style={{ color: '#ff8787' }}>röda</b> kommer ett slag dit. Hoppa till en ruta som inte är röd precis innan den blir helt fylld. När motståndaren är yr 💫: slå så mycket du hinner!</p>
            <button class="btn primary big" onClick={() => setUiBoth('fight')}>⚔️ Strid!</button>
          </div>
        )}
        {ui === 'between' && (
          <div class="storm-overlay">
            <h2>🏆 Du besegrade {o.name}!</h2>
            <p>+{beaten.current[beaten.current.length - 1]?.blad ?? 0} 🌸{d.hitsTaken === 0 ? ' (utan en skråma!)' : ''}</p>
            <p class="small">Du får tillbaka lite liv. Nästa: <b>{OPPONENTS[f.idx + 1].icon} {OPPONENTS[f.idx + 1].name}</b></p>
            <button class="btn primary big" onClick={goNext}>Möt nästa ⚔️</button>
            <button class="btn small" onClick={() => onEnd(beaten.current.map((b) => b.foe))}>Gå hem nöjd</button>
          </div>
        )}
        {ui === 'over' && (
          <div class="storm-overlay">
            <h2>{d.phase === 'won' ? '👑 Du besegrade Arenans mästare!' : `💫 ${o.name} vann den här gången`}</h2>
            <p>{beaten.current.length ? `Du vann ${beaten.current.length} ${beaten.current.length === 1 ? 'strid' : 'strider'} i kväll: +${beaten.current.reduce((a, b) => a + b.blad, 0)} 🌸` : 'Titta på de röda banorna och hoppa precis innan slaget kommer!'}</p>
            <button class="btn primary big" onClick={() => onEnd(beaten.current.map((b) => b.foe))}>Tillbaka</button>
          </div>
        )}
      </div>

      <div class="duel-controls">
        {btn('left', '⬅️')}
        {btn('block', '🛡️')}
        {btn('attack', '⚔️ Slå', 'primary')}
        {btn('right', '➡️')}
      </div>
      <div class="duel-special">
        <div class="duel-meter" aria-label="Superslag"><div style={{ width: `${h.special * 100}%` }} /></div>
        <button class={`btn small${h.special >= 1 ? ' primary' : ''}`} disabled={!fighting || h.special < 1} onPointerDown={(e) => { e.preventDefault(); press(d, 'special'); }}>✨ Superslag</button>
      </div>
      <p class="muted small duel-keys">Tangenter: ←/→ hoppa, ↓ blockera, ↑ eller mellanslag slå, E superslag.</p>
    </div>
  );
}
