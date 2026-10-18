import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HeroFigure } from '../../shell/HeroFigure';
import { knutLoadout, knutResult, type KnutResult } from '../../platform/rpg/trassel';
import {
  attack, BH, BOSS_EVERY, BW, grab, gridFor, HERO, MONS, monAt, moveDrag, newGame, nextKnot, PEG_R, pegAt, release, step, useHint,
  type Game,
} from './sim';

// Trasselvindens skärm: en SVG-bräda med rep, pinnar och monster, och hjältefiguren på golvet nedanför.
// Dra en pinne för att flytta den; tryck på ett monster för att slå. Röda rep korsar ett annat rep.

type Overlay = null | 'intro' | 'quit';

export default function TrasselGame({ hid, seed, start = 1, skatt = false, live, onEnd }: {
  hid: string; seed: number; start?: number; skatt?: boolean; live: { current: Game | null }; onEnd: (r: KnutResult) => void;
}) {
  const g = useMemo(() => newGame(knutLoadout(hid), seed, start, skatt), []);
  live.current = g;
  const [, setRev] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>('intro');
  const svg = useRef<SVGSVGElement>(null);
  const ended = useRef(false);
  const rerender = () => setRev((r) => r + 1);

  // Spelloopen: står still bakom rutorna, så att monstren inte anfaller medan barnet läser.
  useEffect(() => {
    if (overlay) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      step(g, Math.min(0.05, (now - last) / 1000));
      last = now;
      rerender();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [overlay]);

  function finish() {
    if (ended.current) return;
    ended.current = true;
    onEnd(knutResult(g));
  }

  const at = (e: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * BW, y: ((e.clientY - r.top) / r.height) * BH };
  };

  function down(e: PointerEvent) {
    if (overlay || g.phase !== 'play') return;
    const p = at(e);
    const m = monAt(g, p.x, p.y);
    if (m) { attack(g, m.id); rerender(); return; }
    const i = pegAt(g, p.x, p.y);
    if (i !== null) {
      grab(g, i);
      svg.current!.setPointerCapture(e.pointerId);
      rerender();
    }
  }
  function move(e: PointerEvent) {
    if (g.drag === null) return;
    const p = at(e);
    moveDrag(g, p.x, p.y);
  }
  function up() {
    if (g.drag === null) return;
    release(g);
    rerender();
  }

  const { pegs, edges } = g.knot;
  const lo = g.lo;
  const hpPart = g.hp / lo.maxHp;
  const hurt = g.evs.some((e) => e.kind === 'dmg' && e.toHero && e.age < 0.3);
  const zap = g.evs.some((e) => e.kind === 'zap');
  const glow = new Set(g.evs.flatMap((e) => (e.kind === 'glow' ? [e.peg] : [])));
  const pinned = new Set<number>();
  g.bad.forEach((i) => { pinned.add(edges[i][0]); pinned.add(edges[i][1]); });
  const [cols, rows] = gridFor(g.level);

  return (
    <div class="knut">
      <div class="knut-hud">
        <div class="cave-hp"><div class="hpbar"><div style={{ width: `${hpPart * 100}%`, background: hpPart > 0.3 ? 'linear-gradient(90deg,#2f9e44,#69db7c)' : undefined }} /></div><small>❤️ {g.hp}/{lo.maxHp}</small></div>
        <b>Knut {g.level}</b>
        <span>🌸 {g.blad}</span>
      </div>

      <div class={`knut-board${zap ? ' zap' : ''}`}>
        <svg ref={svg} viewBox={`0 0 ${BW} ${BH}`} role="img" aria-label={`Knut ${g.level}: ${pegs.length} pinnar, ${g.cross} korsningar kvar`}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <rect class="knut-floor" x="0" y={BH - 150} width={BW} height="150" />
          {edges.map(([a, b], i) => {
            const cls = g.phase === 'solved' ? 'fri' : g.bad.has(i) ? 'trassel' : '';
            return (
              <g key={i} class={`knut-rep ${cls}`}>
                <line x1={pegs[a].x} y1={pegs[a].y} x2={pegs[b].x} y2={pegs[b].y} class="ytter" />
                <line x1={pegs[a].x} y1={pegs[a].y} x2={pegs[b].x} y2={pegs[b].y} class="inner" />
              </g>
            );
          })}
          {pegs.map((p, i) => (
            <g key={i} class={`knut-pinne${g.drag === i ? ' drar' : ''}${glow.has(i) ? ' glow' : ''}${pinned.has(i) ? ' rod' : ''}`} transform={`translate(${p.x} ${p.y})`}>
              <circle r={PEG_R} />
              <circle r={PEG_R * 0.4} class="hal" />
            </g>
          ))}
          {g.mons.map((m) => (
            <g key={m.id} class={`knut-mon${MONS[m.kind].boss ? ' boss' : ''}`} transform={`translate(${Math.round(m.x)} ${Math.round(m.y)})`}>
              <text text-anchor="middle" dominant-baseline="central">{MONS[m.kind].icon}</text>
              {m.hp < m.maxHp && <><rect x="-40" y="40" width="80" height="10" rx="5" class="hp-bg" /><rect x="-40" y="40" width={(80 * m.hp) / m.maxHp} height="10" rx="5" class="hp" /></>}
              {m.stun > 0 && <text x="34" y="-34" class="stun">💫</text>}
            </g>
          ))}
          {g.evs.map((e) => {
            if (e.kind === 'dmg') return <text key={e.id} x={e.x} y={e.y} text-anchor="middle" class={`knut-fx${e.toHero ? ' hurt' : ''}${e.crit ? ' crit' : ''}`}>−{e.n}</text>;
            if (e.kind === 'text') return <text key={e.id} x={e.x} y={e.y} text-anchor="middle" class="knut-fx info">{e.text}</text>;
            return null;
          })}
        </svg>
        <div class="knut-hero" style={{ left: `${(HERO.x / BW) * 100}%` }}>
          <HeroFigure hid={hid} size={90} pose={hurt ? 'hurt' : g.cd > lo.cd * 0.5 ? 'attack' : null} noPet />
          {lo.pet && <span class="knut-pet">{lo.pet}</span>}
        </div>

        {overlay === 'intro' && (
          <div class="storm-overlay">
            <h2>🪢 Trasselvinden</h2>
            <p>Repen på vinden har trasslat ihop sig! <b>Dra pinnarna</b> så att inga rep korsar varandra. Röda rep är trassliga, och när alla är bruna är knuten löst.</p>
            <p>Vindsmonster kryper fram ibland. <b>Tryck på dem</b> för att slå. 🕷️ Spindlar rycker i repen, så hinn före!</p>
            <p class="small">Den här knuten har {pegs.length} pinnar ({cols} × {rows}).</p>
            <button class="btn primary big" onClick={() => setOverlay(null)}>Börja reda ut! 🪢</button>
          </div>
        )}
        {g.phase === 'solved' && g.last && (
          <div class="storm-overlay">
            <h2>✨ Knut {g.level} är löst!</h2>
            <p>+{g.last.blad} 🌸{g.last.heal > 0 && <> · ❤️ +{g.last.heal} liv</>}</p>
            {g.last.skatt && <p>🎁 Du hittade en skattkista!</p>}
            {(g.level + 1) % BOSS_EVERY === 0 && <p>⚠️ Vid nästa knut kommer Knuttrollet.</p>}
            <button class="btn primary big" onClick={() => { nextKnot(g); rerender(); }}>Nästa knut ({gridFor(g.level + 1).reduce((a, b) => a * b)} pinnar)</button>
            <button class="btn" onClick={finish}>🏡 Gå hem med {g.blad} 🌸</button>
          </div>
        )}
        {g.phase === 'dead' && (
          <div class="storm-overlay">
            <h2>💫 Monstren tog över vinden</h2>
            <p>{g.msg} Du får behålla allt du har samlat: <b>{g.blad} 🌸</b>.</p>
            <button class="btn primary big" onClick={finish}>Tillbaka</button>
          </div>
        )}
        {overlay === 'quit' && (
          <div class="storm-overlay">
            <h2>Lämna vinden?</h2>
            <p>Du får behålla de <b>{g.blad} 🌸</b> du har samlat, men den här knuten räknas inte.</p>
            <button class="btn primary big" onClick={() => setOverlay(null)}>Stanna kvar</button>
            <button class="btn small" onClick={finish}>Lämna ändå</button>
          </div>
        )}
      </div>

      <p class="cave-msg" aria-live="polite">{g.phase === 'play' ? (g.cross > 0 ? `${g.msg} (${g.cross} kvar)` : g.msg) : ' '}</p>
      <div class="cave-actions">
        <button class="btn small" disabled={g.hints < 1 || g.phase !== 'play'} onClick={() => { useHint(g); rerender(); }}>💡 Klurig knuff ({g.hints})</button>
        <button class="btn small" disabled={g.phase !== 'play'} onClick={() => setOverlay('quit')}>🚪 Lämna</button>
      </div>
    </div>
  );
}
