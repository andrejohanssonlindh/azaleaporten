import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HeroFigure } from '../../shell/HeroFigure';
import { caveLoadout, caveKeep } from '../../platform/rpg/grotta';
import { act, attackDir, BOSS_EVERY, descend, GH, goHome, GW, isLit, isSeen, MONS, newCave, pathTo, THINGS, type Action, type Cave } from './sim';

// Grottdykets skärm: ett rutnät av div:ar (golv, väggar, mörker) med monster, saker och hjältefiguren ovanpå.
// Tryck på en ruta för att gå dit (hjälten stannar om något dyker upp), på ett monster för att slå eller skjuta.
// Piltangenter/WASD = ett steg, mellanslag = vänta, Q = drick, E = blixt.

export interface CaveResult { depth: number; blad: number; home: boolean; kills: number }

const WALK_MS = 150;
const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1], A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1],
};
const pos = (x: number, y: number) => ({ transform: `translate(${x * 100}%, ${y * 100}%)` });

type Overlay = null | 'intro' | 'quit';

export default function GrottaGame({ hid, seed, live, onEnd }: { hid: string; seed: number; live: { current: Cave | null }; onEnd: (r: CaveResult) => void }) {
  const cave = useMemo(() => newCave(caveLoadout(hid), seed), []);
  live.current = cave;
  const [, setRev] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>('intro');
  const walk = useRef<{ timer: number; seenMons: Set<number>; hp: number } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const ended = useRef(false);
  const rerender = () => setRev((r) => r + 1);
  const c = cave, h = c.hero, lo = c.lo, f = c.floor;

  const stopWalk = () => { if (walk.current) { clearTimeout(walk.current.timer); walk.current = null; } };
  useEffect(() => stopWalk, []);

  function finish(home: boolean) {
    if (ended.current) return;
    ended.current = true;
    onEnd({ depth: c.depth, blad: c.blad, home, kills: c.kills });
  }

  function doAct(a: Action) {
    if (overlay || c.phase !== 'play') return false;
    const ok = act(c, a);
    rerender();
    return ok;
  }

  const litMons = () => new Set(f.mons.filter((m) => isLit(c, m.x, m.y)).map((m) => m.id));

  /** Går längs vägen ett steg i taget. Stannar om ett nytt monster syns, hjälten skadas eller något händer. */
  function startWalk(path: [number, number][]) {
    stopWalk();
    const state = { timer: 0, seenMons: litMons(), hp: h.hp };
    walk.current = state;
    const next = () => {
      const d = path.shift();
      if (!d || walk.current !== state) { walk.current = null; return; }
      const before = c.blad + h.potions + h.keys + h.dmgBonus + h.armorBonus + h.maxHp;
      if (!doAct({ kind: 'dir', dx: d[0], dy: d[1] })) { walk.current = null; return; }
      const fresh = [...litMons()].some((id) => !state.seenMons.has(id));
      const found = c.blad + h.potions + h.keys + h.dmgBonus + h.armorBonus + h.maxHp !== before;
      if (fresh || h.hp < state.hp || found || c.phase !== 'play' || !path.length) { walk.current = null; return; }
      state.timer = window.setTimeout(next, WALK_MS);
    };
    next();
  }

  function tapTile(x: number, y: number) {
    if (overlay || c.phase !== 'play') return;
    stopWalk();
    const atk = attackDir(c, x, y);
    if (atk) { doAct({ kind: 'dir', dx: atk[0], dy: atk[1] }); return; }
    if (Math.abs(x - h.x) + Math.abs(y - h.y) === 1) { doAct({ kind: 'dir', dx: x - h.x, dy: y - h.y }); return; }
    const p = pathTo(c, x, y);
    if (p) startWalk(p);
  }

  function onBoard(e: MouseEvent) {
    const r = board.current!.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * GW), y = Math.floor(((e.clientY - r.top) / r.height) * GH);
    if (x >= 0 && y >= 0 && x < GW && y < GH) tapTile(x, y);
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (overlay === 'intro' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOverlay(null); return; }
      if (c.phase === 'stairs') {
        if (e.key === 'Enter') { descend(c); rerender(); }
        return;
      }
      const d = KEYS[e.key];
      if (d) { e.preventDefault(); stopWalk(); doAct({ kind: 'dir', dx: d[0], dy: d[1] }); }
      else if (e.key === ' ' || e.key === '.') { e.preventDefault(); stopWalk(); doAct({ kind: 'wait' }); }
      else if (e.key === 'q' || e.key === 'Q') doAct({ kind: 'potion' });
      else if (e.key === 'e' || e.key === 'E') doAct({ kind: 'spell' });
    };
    addEventListener('keydown', down);
    return () => removeEventListener('keydown', down);
  });

  const hpPart = h.hp / h.maxHp;
  const canSpell = lo.off === 'trollbok';
  const zap = c.evs.find((e) => e.kind === 'zap');

  return (
    <div class="cave">
      <div class="cave-hud">
        <div class="cave-hp"><div class="hpbar"><div style={{ width: `${hpPart * 100}%`, background: hpPart > 0.3 ? 'linear-gradient(90deg,#2f9e44,#69db7c)' : undefined }} /></div><small>❤️ {h.hp}/{h.maxHp}</small></div>
        <b>Våning {c.depth}</b>
        <span>🌸 {c.blad}{h.keys > 0 && <> · 🗝️ {h.keys}</>}</span>
      </div>

      <div class={`cave-board${zap ? ' zap' : ''}`} ref={board} onClick={onBoard} role="grid" aria-label={`Grottan, våning ${c.depth}`}>
        {f.open.map((open, i) => {
          const x = i % GW, y = Math.floor(i / GW);
          const vis = isLit(c, x, y) ? 'lit' : isSeen(c, x, y) ? 'seen' : 'dark';
          return <div key={i} class={`ct ${open ? 'floor' : 'wall'} ${vis}`} />;
        })}
        {isSeen(c, f.stairs.x, f.stairs.y) && <span class="ce stairs" style={pos(f.stairs.x, f.stairs.y)} title="Trappan ner">🪜</span>}
        {f.traps.filter((t) => t.seen).map((t) => <span key={`t${t.x}-${t.y}`} class="ce" style={pos(t.x, t.y)} title="Fälla">🪤</span>)}
        {f.things.filter((t) => isSeen(c, t.x, t.y)).map((t) => (
          <span key={t.id} class={`ce thing${isLit(c, t.x, t.y) ? '' : ' dim'}`} style={pos(t.x, t.y)} title={THINGS[t.kind].name}>
            {THINGS[t.kind].icon}{t.kind === 'blad' && t.v > 1 && <small>{t.v}</small>}
          </span>
        ))}
        {f.mons.filter((m) => isLit(c, m.x, m.y)).map((m) => {
          const bump = c.evs.find((e) => e.kind === 'bump' && e.who === m.id);
          return (
            <span key={m.id} class={`ce mon${m.kind === 'drake' ? ' boss' : ''}`} style={pos(m.x, m.y)} title={MONS[m.kind].name}>
              <span key={bump?.id ?? 'still'} class={bump && bump.kind === 'bump' ? `bump b${bump.dx}${bump.dy}` : ''}>{MONS[m.kind].icon}</span>
              {m.hp < m.maxHp && <span class="ce-hp"><span style={{ width: `${(m.hp / m.maxHp) * 100}%` }} /></span>}
              {m.stun > 0 && <span class="ce-stun">💫</span>}
            </span>
          );
        })}
        <span class="ce hero" style={pos(h.x, h.y)}>
          <span class={h.face < 0 ? 'flip' : ''}><HeroFigure hid={hid} size={60} noPet /></span>
          {lo.pet && <span class="ce-pet">{lo.pet}</span>}
        </span>
        {c.evs.map((e) => {
          if (e.kind === 'dmg') return <span key={e.id} class={`ce cave-fx${e.toHero ? ' hurt' : ''}${e.crit ? ' crit' : ''}`} style={pos(e.x, e.y)}>−{e.n}</span>;
          if (e.kind === 'text') return <span key={e.id} class="ce cave-fx info" style={pos(e.x, e.y)}>{e.text}</span>;
          if (e.kind === 'shot') return (
            <span key={e.id} class={`ce cave-shot${e.magic ? ' magic' : ''}`}
              style={{ '--x1': `${e.x1 * 100}%`, '--y1': `${e.y1 * 100}%`, '--x2': `${e.x2 * 100}%`, '--y2': `${e.y2 * 100}%`, ...pos(e.x2, e.y2) }}>{e.magic ? '✨' : '➶'}</span>
          );
          return null;
        })}

        {overlay === 'intro' && (
          <div class="storm-overlay" onClick={(e) => e.stopPropagation()}>
            <h2>⛏️ Grottdyket</h2>
            <p><b>Tryck på en ruta</b> för att gå dit, och på ett monster för att slå{lo.range ? ' eller skjuta' : ''}. Piltangenterna går också.</p>
            <p>Monstren rör sig bara när du gör något, så du hinner tänka. Hitta trappan 🪜 – vid varje trappa väljer du: djupare, eller hem med skatten.</p>
            <button class="btn primary big" onClick={() => setOverlay(null)}>Kliv ner! ⛏️</button>
          </div>
        )}
        {c.phase === 'stairs' && (
          <div class="storm-overlay" onClick={(e) => e.stopPropagation()}>
            <h2>🪜 Du hittade trappan!</h2>
            <p>Du har <b>{c.blad} 🌸</b>. Går du hem får du behålla allt. Faller du längre ner får du bara behålla hälften.</p>
            {(c.depth + 1) % BOSS_EVERY === 0 && <p>⚠️ På nästa våning vaktar en boss trappan.</p>}
            <button class="btn primary big" onClick={() => { descend(c); rerender(); }}>⬇️ Djupare (våning {c.depth + 1})</button>
            <button class="btn" onClick={() => { goHome(c); finish(true); }}>🏡 Gå hem med {c.blad} 🌸</button>
          </div>
        )}
        {c.phase === 'dead' && (
          <div class="storm-overlay" onClick={(e) => e.stopPropagation()}>
            <h2>💫 Du föll på våning {c.depth}</h2>
            <p>Du får behålla hälften av skatten: <b>{caveKeep(c.blad, false)} 🌸</b>.</p>
            <button class="btn primary big" onClick={() => finish(false)}>Tillbaka upp</button>
          </div>
        )}
        {overlay === 'quit' && (
          <div class="storm-overlay" onClick={(e) => e.stopPropagation()}>
            <h2>Lämna grottan?</h2>
            <p>Lämnar du mitt på en våning får du bara behålla hälften: <b>{caveKeep(c.blad, false)} 🌸</b>. Hitta trappan för att få allt!</p>
            <button class="btn primary big" onClick={() => setOverlay(null)}>Stanna kvar</button>
            <button class="btn small" onClick={() => finish(false)}>Lämna ändå</button>
          </div>
        )}
      </div>

      <p class="cave-msg" aria-live="polite">{c.msg || ' '}</p>
      <div class="cave-actions">
        <button class="btn small" disabled={h.potions < 1 || h.hp >= h.maxHp || c.phase !== 'play'} onClick={() => doAct({ kind: 'potion' })}>🧪 Drick ({h.potions})</button>
        {canSpell && <button class="btn small" disabled={h.spell > 0 || c.phase !== 'play'} onClick={() => doAct({ kind: 'spell' })}>⚡ Blixt{h.spell > 0 ? ` (${h.spell})` : ''}</button>}
        <button class="btn small" disabled={c.phase !== 'play'} onClick={() => { stopWalk(); doAct({ kind: 'wait' }); }}>⏳ Vänta</button>
        <button class="btn small" disabled={c.phase !== 'play'} onClick={() => setOverlay('quit')}>🚪 Lämna</button>
      </div>
      <p class="muted small cave-keys">Tangenter: pilar/WASD går, mellanslag väntar, Q dricker{canSpell ? ', E blixtrar' : ''}.</p>
    </div>
  );
}
