import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HeroFigure } from '../../shell/HeroFigure';
import { KEYS } from '../../platform/rpg/balance';
import { KNUT_MODES, knutLoadout, knutResult, type KnutMode, type KnutResult } from '../../platform/rpg/trassel';
import { attack, BH, BOSS_EVERY, BW, HERO, MONS, monAt, nextKnot, segDist, step, useHint, type Game, type Pt } from './strid';
import { grab, gridFor, moveDrag, newGame, PEG_R, release, type PinnGame } from './sim';
import { FARGER, lagg, lyft, newRepGame, PIN_R, repFor, type RepGame } from './rep';

// Trasselvindens skärm: en SVG-bräda med pusslet (pinnknutar eller repknutar), monstren och
// hjältefiguren på golvet nedanför. Tryck på ett monster för att slå. I pinnläget drar man pinnar;
// i repläget drar man en repände till ett tomt hål (eller trycker på änden och sedan på hålet).

type Overlay = null | 'intro' | 'quit';

const isRep = (g: Game): g is RepGame => 'reps' in g.pz;

export default function TrasselGame({ hid, seed, start = 1, skatt = false, mode = 'pinnar', live, onEnd }: {
  hid: string; seed: number; start?: number; skatt?: boolean; mode?: KnutMode; live: { current: Game | null }; onEnd: (r: KnutResult) => void;
}) {
  const g: Game = useMemo(() => (mode === 'rep' ? newRepGame : newGame)(knutLoadout(hid), seed, start, skatt), []);
  live.current = g;
  const [, setRev] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>('intro');
  const svg = useRef<SVGSVGElement>(null);
  /** Repläget: var den lyfta änden är medan barnet drar. */
  const drag = useRef<{ at: Pt; from: Pt; moved: boolean } | null>(null);
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

  const at = (e: PointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * BW, y: ((e.clientY - r.top) / r.height) * BH };
  };

  function down(e: PointerEvent) {
    if (overlay || g.phase !== 'play') return;
    const p = at(e);
    const m = monAt(g, p.x, p.y);
    if (m) { attack(g, m.id); rerender(); return; }
    if (isRep(g)) {
      const pz = g.pz;
      if (pz.held) {
        // En ände är redan vald: ett tryck på ett tomt hål lägger den där.
        const h = pz.holeAt(p.x, p.y);
        if (h !== null && pz.isFree(h)) { lagg(g, h); rerender(); return; }
        pz.held = null;
      }
      const pin = pz.pinAt(p.x, p.y);
      if (pin && lyft(g, pin.rep, pin.end)) {
        drag.current = { at: p, from: p, moved: false };
        svg.current!.setPointerCapture(e.pointerId);
      }
      rerender();
      return;
    }
    const pg = g as PinnGame;
    const i = pg.pz.pegAt(p.x, p.y);
    if (i !== null) {
      grab(pg, i);
      svg.current!.setPointerCapture(e.pointerId);
      rerender();
    }
  }
  function move(e: PointerEvent) {
    const p = at(e);
    if (isRep(g)) {
      const d = drag.current;
      if (!d || !g.pz.held) return;
      d.at = p;
      if (Math.hypot(p.x - d.from.x, p.y - d.from.y) > 30) d.moved = true;
      return;
    }
    moveDrag(g as PinnGame, p.x, p.y);
  }
  function up(e: PointerEvent) {
    if (isRep(g)) {
      const d = drag.current;
      drag.current = null;
      // Ett kort tryck låter änden vara vald; ett drag släpper den där fingret är.
      if (d?.moved && g.pz.held) { const p = at(e); lagg(g, g.pz.holeAt(p.x, p.y)); }
      rerender();
      return;
    }
    const pg = g as PinnGame;
    if (pg.pz.drag === null) return;
    release(pg);
    rerender();
  }

  const lo = g.lo;
  const hpPart = g.hp / lo.maxHp;
  const hurt = g.evs.some((e) => e.kind === 'dmg' && e.toHero && e.age < 0.3);
  const zap = g.evs.some((e) => e.kind === 'zap');
  const glow = new Set(g.evs.flatMap((e) => (e.kind === 'glow' ? [e.i] : [])));
  const info = KNUT_MODES[mode];
  const size = (l: number) => (mode === 'rep' ? `${repFor(l).reps} rep` : `${gridFor(l).reduce((a, b) => a * b)} pinnar`);
  const kvar = g.pz.kvar();

  return (
    <div class="knut">
      <div class="knut-hud">
        <div class="cave-hp"><div class="hpbar"><div style={{ width: `${hpPart * 100}%`, background: hpPart > 0.3 ? 'linear-gradient(90deg,#2f9e44,#69db7c)' : undefined }} /></div><small>❤️ {g.hp}/{lo.maxHp}</small></div>
        <b>{info.icon} Knut {g.level}</b>
        <span>🌸 {g.blad}{g.skatt && <> · 🎁 {g.skatter}/{KEYS.chestsPerRun}</>}</span>
      </div>

      <div class={`knut-board${zap ? ' zap' : ''}`}>
        <svg ref={svg} viewBox={`0 0 ${BW} ${BH}`} role="img" aria-label={`${info.name}, knut ${g.level}: ${kvar} kvar`}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <rect class="knut-floor" x="0" y={BH - 150} width={BW} height="150" />
          {isRep(g) ? <RepLayer g={g} glow={glow} drag={drag.current} /> : <PinnLayer g={g as PinnGame} glow={glow} />}
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
            <h2>{info.icon} {info.name}</h2>
            {mode === 'rep' ? (
              <>
                <p>Repen ligger huller om buller! <b>Dra en repände</b> till ett tomt hål, eller tryck på änden och sedan på hålet. Knuten är löst när inga rep ligger över varandra.</p>
                <p>🔒 Ett rep som har ett annat rep ovanpå sig går inte att lyfta. Börja med det som ligger <b>överst</b>! Ett rep du flyttar hamnar alltid överst.</p>
                {isRep(g) && g.pz.plugs.size > 0 && <p>🪵 Pluggade hål går inte att använda, och inget rep får ligga över en plugg.</p>}
              </>
            ) : (
              <p>Repen på vinden har trasslat ihop sig! <b>Dra pinnarna</b> så att inga rep korsar varandra. Röda rep är trassliga, och när alla är bruna är knuten löst.</p>
            )}
            <p>Vindsmonster kryper fram ibland. <b>Tryck på dem</b> för att slå. 🕷️ Spindlar trasslar till repen, så hinn före!</p>
            {g.skatt && <p>🗝️ <b>Skattrunda!</b> Varannan knut du löser gömmer en skattkista 🎁 (högst {KEYS.chestsPerRun}).</p>}
            <p class="small">Den här knuten har {size(g.level)}.</p>
            <button class="btn primary big" onClick={() => setOverlay(null)}>Börja reda ut! {info.icon}</button>
          </div>
        )}
        {g.phase === 'solved' && g.last && (
          <div class="storm-overlay">
            <h2>✨ Knut {g.level} är löst!</h2>
            <p>+{g.last.blad} 🌸{g.last.heal > 0 && <> · ❤️ +{g.last.heal} liv</>}</p>
            {g.last.bonus > 0 && <p>⭐ +{g.last.bonus} 🌸 extra: du klarade det på få drag!</p>}
            {g.last.skatt && <p>🎁 Du hittade en skattkista!</p>}
            {(g.level + 1) % BOSS_EVERY === 0 && <p>⚠️ Vid nästa knut kommer Knuttrollet.</p>}
            <button class="btn primary big" onClick={() => { nextKnot(g); rerender(); }}>Nästa knut ({size(g.level + 1)})</button>
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

      <p class="cave-msg" aria-live="polite">{g.phase !== 'play' ? ' ' : kvar > 0 && !g.msg.includes('kvar') ? `${g.msg} (${kvar} kvar)` : g.msg}</p>
      <div class="cave-actions">
        {isRep(g) && <span class="knut-drag">Drag: <b>{g.pz.moves}</b> av ⭐ {g.pz.par}</span>}
        <button class="btn small" disabled={g.hints < 1 || g.phase !== 'play'} onClick={() => { useHint(g); rerender(); }}>💡 Klurig knuff ({g.hints})</button>
        <button class="btn small" disabled={g.phase !== 'play'} onClick={() => setOverlay('quit')}>🚪 Lämna</button>
      </div>
    </div>
  );
}

function PinnLayer({ g, glow }: { g: PinnGame; glow: Set<number> }) {
  const { pegs, edges, bad, drag } = g.pz;
  const pinned = new Set<number>();
  bad.forEach((i) => { pinned.add(edges[i][0]); pinned.add(edges[i][1]); });
  return (
    <>
      {edges.map(([a, b], i) => {
        const cls = g.phase === 'solved' ? 'fri' : bad.has(i) ? 'trassel' : '';
        return (
          <g key={i} class={`knut-rep ${cls}`}>
            <line x1={pegs[a].x} y1={pegs[a].y} x2={pegs[b].x} y2={pegs[b].y} class="ytter" />
            <line x1={pegs[a].x} y1={pegs[a].y} x2={pegs[b].x} y2={pegs[b].y} class="inner" />
          </g>
        );
      })}
      {pegs.map((p, i) => (
        <g key={i} class={`knut-pinne${drag === i ? ' drar' : ''}${glow.has(i) ? ' glow' : ''}${pinned.has(i) ? ' rod' : ''}`} transform={`translate(${p.x} ${p.y})`}>
          <circle r={PEG_R} />
          <circle r={PEG_R * 0.4} class="hal" />
        </g>
      ))}
    </>
  );
}

function RepLayer({ g, glow, drag }: { g: RepGame; glow: Set<number>; drag: { at: Pt; moved: boolean } | null }) {
  const pz = g.pz, held = pz.held;
  const used = pz.used();
  const overPlug = new Set<number>();
  for (const p of pz.plugs) if (pz.reps.some((_, i) => held?.rep !== i && segDist(pz.holes[p], pz.end(i, 0), pz.end(i, 1)) < PIN_R)) overPlug.add(p);
  // Lägst först, så att det översta repet ritas sist. Repet barnet håller i lyfts över allt.
  const lager = (i: number) => (held?.rep === i ? 99 : pz.reps[i].z);
  const order = [...pz.reps.keys()].sort((a, b) => lager(a) - lager(b));
  const endAt = (i: number, e: 0 | 1): Pt => (held && held.rep === i && held.end === e && drag?.moved ? drag.at : pz.end(i, e));
  return (
    <>
      {pz.holes.map((h, i) => (
        <circle key={i} cx={h.x} cy={h.y} r={18} class={`rep-hal${held && !used.has(i) && !pz.plugs.has(i) ? ' mal' : ''}`} />
      ))}
      {order.map((i) => {
        const a = endAt(i, 0), b = endAt(i, 1), lift = held?.rep === i;
        const color = FARGER[pz.reps[i].farg];
        return (
          <g key={i} class={`rep${lift ? ' lyft' : ''}${pz.fria.has(i) ? ' fri' : ''}${glow.has(i) ? ' glow' : ''}`}>
            <line x1={a.x + 6} y1={a.y + 9} x2={b.x + 6} y2={b.y + 9} class="skugga" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class="kant" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} class="farg" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class="glans" />
            {[a, b].map((p, e) => (
              <g key={e} transform={`translate(${Math.round(p.x)} ${Math.round(p.y)})`} class={`rep-pinne${lift && held!.end === e ? ' vald' : ''}`}>
                <circle r={PIN_R} fill={color} />
                <circle r={PIN_R * 0.35} class="knopp" />
              </g>
            ))}
          </g>
        );
      })}
      {/* Pluggarna sticker upp, så de ritas över repen: ett rep som ligger över en plugg syns fastna. */}
      {[...pz.plugs].map((i) => (
        <g key={`p${i}`} class={`rep-plugg${overPlug.has(i) ? ' rod' : ''}`} transform={`translate(${pz.holes[i].x} ${pz.holes[i].y})`}>
          <circle r={26} />
          <circle r={14} class="topp" />
        </g>
      ))}
    </>
  );
}
