import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HeroFigure } from '../../shell/HeroFigure';
import { stormLoadout, STORM_WAVES } from '../../platform/rpg/dimstorm';
import { auraRadius, choose, FOES, H, needXp, newGame, orbitPositions, step, UPS, W, WAVE_SECS, wavesCleared, type Game, type UpId } from './sim';

// Dimstormens skärm: ritar spelet på en canvas, hjältefiguren (SVG) ligger ovanpå och följer med.
// Styrs med fingret (en "joystick" där man sätter ner fingret) eller med piltangenterna/WASD.

export interface StormResult { won: boolean; waves: number; picked: number; kills: number; lvl: number }

const STEP = 1 / 60;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1], A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1],
};
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ritning ---------- */

/** Emoji ritade en gång till små bilder; att rita text varje bildruta är långsamt. */
class Sprites {
  private cache = new Map<string, HTMLCanvasElement>();
  pr: number;
  constructor(pr: number) { this.pr = pr; }
  get(icon: string, size: number) {
    const key = `${icon}|${size}`;
    let c = this.cache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      const px = Math.ceil(size * this.pr * 1.3);
      c.width = c.height = px;
      const x = c.getContext('2d')!;
      x.font = `${size * this.pr}px ${EMOJI_FONT}`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(icon, px / 2, px / 2 + size * this.pr * 0.06);
      this.cache.set(key, c);
    }
    return c;
  }
  draw(ctx: CanvasRenderingContext2D, icon: string, x: number, y: number, size: number) {
    const c = this.get(icon, size), s = c.width / this.pr;
    ctx.drawImage(c, x - s / 2, y - s / 2, s, s);
  }
}

/** Ängen: ritas en gång per storlek. */
function meadow(pr: number, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(W * pr); c.height = Math.round(H * pr);
  const x = c.getContext('2d')!;
  x.scale(pr, pr);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6b9a55'); g.addColorStop(1, '#3f6e3c');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 90; i++) {
    const px = rnd() * W, py = rnd() * H;
    x.strokeStyle = 'rgba(30,70,30,.2)';
    x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px - 2, py - 6); x.moveTo(px, py); x.lineTo(px + 2, py - 6); x.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const px = rnd() * W, py = rnd() * H;
    // Inga rosa blommor: de skulle se ut som azaleablad att plocka.
    x.fillStyle = i % 2 ? 'rgba(255,255,255,.75)' : 'rgba(255,212,59,.75)';
    for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(px + Math.cos(k * 1.26) * 2.2, py + Math.sin(k * 1.26) * 2.2, 1.5, 0, 7); x.fill(); }
    x.fillStyle = '#e67700'; x.beginPath(); x.arc(px, py, 1.1, 0, 7); x.fill();
  }
  return c;
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, part: number, color: string) {
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  if (part > 0) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * Math.min(1, part)), h, h / 2); ctx.fill(); }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = '#fff', align: CanvasTextAlign = 'center') {
  ctx.font = `800 ${size}px ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 5);
  ctx.strokeStyle = 'rgba(0,0,0,.65)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function draw(ctx: CanvasRenderingContext2D, g: Game, sp: Sprites, bg: HTMLCanvasElement, stick: { ox: number; oy: number; x: number; y: number } | null, calm: boolean) {
  const h = g.hero;
  const shake = !calm && g.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
  ctx.setTransform(sp.pr, 0, 0, sp.pr, shake * sp.pr, shake * sp.pr * 0.6);
  ctx.drawImage(bg, 0, 0, W, H);

  // Lyktans ljus och skölden
  const aura = auraRadius(g);
  if (aura) {
    const gr = ctx.createRadialGradient(h.x, h.y, 4, h.x, h.y, aura);
    gr.addColorStop(0, 'rgba(255,230,120,.45)'); gr.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(h.x, h.y, aura, 0, 7); ctx.fill();
  }
  if (g.lo.off === 'skold' && h.shield <= 0) {
    ctx.strokeStyle = 'rgba(116,192,252,.8)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(h.x, h.y - 2, 24, 0, 7); ctx.stroke();
  }

  // Saker på marken
  for (const d of g.drops) {
    if (d.kind === 'xp') {
      const r = d.v >= 3 ? 5 : 3.5;
      ctx.fillStyle = d.v >= 3 ? '#da77f2' : '#66d9e8';
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(d.x, d.y - r * 1.4); ctx.lineTo(d.x + r, d.y); ctx.lineTo(d.x, d.y + r * 1.4); ctx.lineTo(d.x - r, d.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else sp.draw(ctx, d.kind === 'blad' ? '🌸' : '🍓', d.x, d.y, d.kind === 'blad' ? 15 : 16);
  }

  // Jättens anfall syns i förväg
  for (const f of g.foes) {
    if (f.boss?.state !== 'aim') continue;
    const len = 320 * 0.75 + f.r, ang = Math.atan2(f.boss.dy, f.boss.dx);
    ctx.save();
    ctx.translate(f.x, f.y); ctx.rotate(ang);
    ctx.fillStyle = `rgba(224,49,49,${0.18 + 0.15 * Math.sin(g.t * 20)})`;
    ctx.fillRect(0, -f.r, len, f.r * 2);
    ctx.restore();
  }

  // Monstren
  for (const f of g.foes) {
    const size = f.r * 2.3;
    sp.draw(ctx, FOES[f.kind].icon, f.x, f.y, size);
    if (f.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
    }
    if (f.stun > 0) sp.draw(ctx, '💫', f.x, f.y - f.r - 4, 11);
    if (!f.boss && f.maxHp >= 40 && f.hp < f.maxHp) bar(ctx, f.x - f.r, f.y + f.r + 2, f.r * 2, 4, f.hp / f.maxHp, '#ff6b6b');
  }

  // Skott, snurrande saker, husdjuret
  for (const s of g.shots) {
    if (s.kind === 'pil') {
      const a = Math.atan2(s.vy, s.vx);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a);
      ctx.strokeStyle = '#5c3a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = '#ced4da'; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(-3, -3); ctx.lineTo(-3, 3); ctx.fill();
      ctx.restore();
    } else {
      const gr = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, 9);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, '#b197fc'); gr.addColorStop(1, 'rgba(132,94,247,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, 7); ctx.fill();
    }
  }
  for (const o of orbitPositions(g)) sp.draw(ctx, o.icon, o.x, o.y, 18);
  if (g.lo.pet) sp.draw(ctx, g.lo.pet, h.pet.x, h.pet.y, 20);

  // Effekter
  for (const e of g.fx) {
    const k = 1 - e.t / e.ttl;
    switch (e.kind) {
      case 'arc':
        ctx.fillStyle = `rgba(255,255,255,${0.45 * k})`;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, e.r, e.ang - e.spread / 2, e.ang + e.spread / 2); ctx.closePath(); ctx.fill();
        break;
      case 'ring':
        ctx.strokeStyle = e.color; ctx.globalAlpha = k; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.5 + 0.5 * (1 - k)), 0, 7); ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'zap':
        ctx.strokeStyle = `rgba(255,236,153,${k})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(e.x1, e.y1);
        for (let i = 1; i <= 4; i++) ctx.lineTo(e.x1 + ((e.x2 - e.x1) * i) / 4 + (i < 4 ? (i % 2 ? 6 : -6) : 0), e.y1 + ((e.y2 - e.y1) * i) / 4);
        ctx.stroke();
        break;
      case 'poof':
        ctx.fillStyle = `rgba(230,230,240,${0.6 * k})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, 8 + 14 * (1 - k), 0, 7); ctx.fill();
        break;
      case 'num':
        label(ctx, e.text, e.x, e.y - 16 * (1 - k), e.crit ? 15 : 11, e.crit ? '#ffd43b' : '#fff');
        break;
    }
  }

  // Dimman vid kanterna
  const mist = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  mist.addColorStop(0, 'rgba(210,214,228,0)'); mist.addColorStop(1, 'rgba(210,214,228,.75)');
  ctx.fillStyle = mist;
  ctx.fillRect(-10, -10, W + 20, H + 20);
  if (h.inv > 0.35 && h.hurts) { ctx.fillStyle = 'rgba(224,49,49,.18)'; ctx.fillRect(-10, -10, W + 20, H + 20); }

  // Mätarna överst
  ctx.setTransform(sp.pr, 0, 0, sp.pr, 0, 0);
  bar(ctx, 8, 8, 128, 12, h.hp / h.maxHp, h.hp / h.maxHp > 0.3 ? '#51cf66' : '#ff6b6b');
  label(ctx, `❤️ ${Math.ceil(h.hp)}`, 140, 14, 11, '#fff', 'left');
  const boss = g.foes.find((f) => f.boss);
  label(ctx, g.wave > STORM_WAVES ? 'Stormjätten!' : `Våg ${g.wave} av ${STORM_WAVES}`, W / 2 + 34, 14, 12);
  label(ctx, `🌸 ${g.picked}`, W - 8, 14, 12, '#fff', 'right');
  bar(ctx, 8, 25, W - 16, 6, g.wave > STORM_WAVES ? 1 : g.waveT / WAVE_SECS, 'rgba(255,255,255,.7)');
  bar(ctx, 8, 34, W - 16, 6, g.xp / needXp(g.lvl), '#66d9e8');
  label(ctx, `Nivå ${g.lvl}`, 10, 47, 10, '#c5f6fa', 'left');
  if (boss) {
    bar(ctx, 40, H - 22, W - 80, 12, boss.hp / boss.maxHp, '#e03131');
    label(ctx, FOES.jatte.name, W / 2, H - 32, 12);
  }
  for (const e of g.fx) if (e.kind === 'text') {
    ctx.globalAlpha = Math.min(1, (e.ttl - e.t) * 2);
    label(ctx, e.text, W / 2, H * 0.3, 28, '#fff');
    ctx.globalAlpha = 1;
  }
  if (g.phase === 'won') label(ctx, 'Du klarade stormen! 🏆', W / 2, H / 2, 26, '#ffd43b');
  if (g.phase === 'lost') label(ctx, h.hp <= 0 ? 'Dimman tog dig den här gången…' : 'Stormen är slut', W / 2, H / 2, 18);

  // Fingrets joystick
  if (stick) {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 30, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath(); ctx.arc(stick.x, stick.y, 13, 0, 7); ctx.fill();
  }
}

/* ---------- komponenten ---------- */

type Ui = 'intro' | 'play' | 'choose' | 'paused' | 'over';

export default function StormGame({ hid, steg, seed, live, onEnd }: { hid: string; steg: number; seed: number; live: { current: Game | null }; onEnd: (r: StormResult) => void }) {
  const game = useMemo(() => newGame(stormLoadout(hid), steg, seed), []);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const heroEl = useRef<HTMLDivElement>(null);
  const [ui, setUi] = useState<Ui>('intro');
  const uiRef = useRef<Ui>('intro');
  const [figSize, setFigSize] = useState(44);
  const keys = useRef(new Set<string>());
  const stick = useRef<{ id: number; ox: number; oy: number; x: number; y: number } | null>(null);
  const setUiBoth = (u: Ui) => { uiRef.current = u; setUi(u); };
  live.current = game;

  // Spelslingan
  useEffect(() => {
    const cv = canvas.current!, ctx = cv.getContext('2d')!;
    let sp = new Sprites(1), bg = meadow(1, seed), size = 0, raf = 0, last = performance.now(), acc = 0, endAt = 0, swings = 0;
    const calm = reducedMotion();

    const fit = () => {
      const w = wrap.current!.clientWidth;
      if (!w || w === size) return;
      size = w;
      const s = w / W, pr = s * Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(W * pr); cv.height = Math.round(H * pr);
      sp = new Sprites(pr);
      bg = meadow(pr, seed);
      setFigSize(Math.round(62 * s));
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      fit();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (uiRef.current === 'play' && game.phase === 'play') {
        let dx = 0, dy = 0;
        for (const k of keys.current) { const v = KEYS[k]; if (v) { dx += v[0]; dy += v[1]; } }
        const st = stick.current;
        if (st) { dx += (st.x - st.ox) / 30; dy += (st.y - st.oy) / 30; }
        acc += dt;
        while (acc >= STEP && game.phase === 'play') { step(game, STEP, { dx, dy }); acc -= STEP; }
      } else acc = 0;
      if (game.phase === 'choose' && uiRef.current === 'play') setUiBoth('choose');
      if ((game.phase === 'won' || game.phase === 'lost') && !endAt) endAt = now + 1600;
      if (endAt && now >= endAt && uiRef.current !== 'over') {
        setUiBoth('over');
        onEnd({ won: game.phase === 'won', waves: wavesCleared(game), picked: game.picked, kills: game.kills, lvl: game.lvl });
      }
      const sc = size / W;
      draw(ctx, game, sp, bg, stick.current && { ox: stick.current.ox / sc, oy: stick.current.oy / sc, x: stick.current.x / sc, y: stick.current.y / sc }, calm);

      // Hjältefiguren följer med
      const el = heroEl.current, h = game.hero;
      if (el) {
        const fw = el.offsetWidth, fh = el.offsetHeight;
        el.style.transform = `translate(${h.x * sc - fw / 2}px, ${h.y * sc - fh * 0.62}px) scaleX(${h.fx < -0.1 ? -1 : 1})`;
        el.style.opacity = h.inv > 0 && h.hurts && Math.floor(now / 90) % 2 ? '0.45' : '1';
        if (h.swings !== swings && !calm) {
          swings = h.swings;
          const svg = el.querySelector('svg');
          if (svg) { svg.classList.remove('pose-attack'); void svg.getBoundingClientRect(); svg.classList.add('pose-attack'); }
        }
      }
    };
    raf = requestAnimationFrame(frame);

    const hide = () => { if (document.hidden && uiRef.current === 'play') setUiBoth('paused'); };
    document.addEventListener('visibilitychange', hide);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', hide); };
  }, []);

  // Tangentbordet
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (KEYS[e.key]) { keys.current.add(e.key); e.preventDefault(); }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') setUiBoth(uiRef.current === 'play' ? 'paused' : uiRef.current === 'paused' ? 'play' : uiRef.current);
      if (uiRef.current === 'choose' && /^[1-4]$/.test(e.key)) pick(game.offer[Number(e.key) - 1]);
      if (uiRef.current === 'intro' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setUiBoth('play'); }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    const blur = () => keys.current.clear();
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', blur);
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', blur); };
  }, []);

  function pick(id: UpId | undefined) {
    if (!id) return;
    choose(game, id);
    // En ny nivå kan vänta direkt (många kristaller på en gång).
    setUiBoth(game.phase === 'choose' ? 'choose' : 'play');
  }

  // Fingret: där man sätter ner det blir mitten på en joystick.
  const pos = (e: PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: PointerEvent) => {
    if (uiRef.current !== 'play' || stick.current) return;
    const p = pos(e);
    stick.current = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const st = stick.current;
    if (!st || st.id !== e.pointerId) return;
    const p = pos(e), dx = p.x - st.ox, dy = p.y - st.oy, d = Math.hypot(dx, dy), max = 40;
    // Drar man långt följer mitten med, så att man aldrig "tappar" spaken.
    if (d > max) { st.ox += (dx / d) * (d - max); st.oy += (dy / d) * (d - max); }
    st.x = p.x; st.y = p.y;
  };
  const onUp = (e: PointerEvent) => { if (stick.current?.id === e.pointerId) stick.current = null; };

  const lo = game.lo;
  return (
    <div class="storm">
      <div class="storm-top">
        <button class="btn small" disabled={ui !== 'play'} onClick={() => setUiBoth('paused')} aria-label="Pausa">⏸ Paus</button>
        <span class="muted small">Steg {steg}</span>
      </div>
      <div class="storm-stage" ref={wrap} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <canvas ref={canvas} aria-label="Dimstormen" role="img" />
        <div class="storm-hero" ref={heroEl}><HeroFigure hid={hid} size={figSize} noPet /></div>

        {ui === 'intro' && (
          <div class="storm-overlay">
            <h2>🌪️ Dimstormen, steg {steg}</h2>
            <p><b>Sätt fingret var som helst och dra</b> för att springa (eller använd piltangenterna).</p>
            <p>Din hjälte slåss själv med {lo.weapon === 'nava' ? 'nävarna' : `sin ${lo.weaponIcon}`}. Plocka 💠 kristaller för att bli starkare, och klara {STORM_WAVES} vågor och Stormjätten!</p>
            <button class="btn primary big" onClick={() => setUiBoth('play')}>Kör! ⚔️</button>
          </div>
        )}
        {ui === 'choose' && (
          <div class="storm-overlay">
            <h2>✨ Nivå {game.lvl}! Välj en kraft</h2>
            <div class="storm-cards">
              {game.offer.map((id, i) => {
                const [name, desc] = UPS[id].text(lo.weapon);
                return (
                  <button key={id} class="storm-card" onClick={() => pick(id)}>
                    <span class="storm-card-icon">{UPS[id].icon}</span>
                    <b>{name}</b>
                    <small>{desc}</small>
                    {UPS[id].max < 99 && <span class="storm-dots" aria-label={`${game.ups[id]} av ${UPS[id].max}`}>{'●'.repeat(game.ups[id])}{'○'.repeat(UPS[id].max - game.ups[id])}</span>}
                    <kbd class="storm-key">{i + 1}</kbd>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {ui === 'paused' && (
          <div class="storm-overlay">
            <h2>⏸ Paus</h2>
            <p class="small">Våg {Math.min(game.wave, STORM_WAVES)} · 🌸 {game.picked} plockade</p>
            <button class="btn primary big" onClick={() => setUiBoth('play')}>Fortsätt</button>
            <button class="btn small" onClick={() => { game.phase = 'lost'; setUiBoth('play'); }}>Avsluta stormen</button>
          </div>
        )}
      </div>
    </div>
  );
}
