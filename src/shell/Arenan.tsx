import { useEffect, useRef, useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { heroStats } from '../platform/rpg/inventory';
import { ARENA, arenaStats, buyToken, meterAt, opponentFor, OPPONENTS, payToken, swingAt, winArena, type Swing } from '../platform/rpg/arena';
import { leaveToPicker } from '../session';
import { HeroFigure } from './HeroFigure';
import { BackBar, Screen } from './ui';

// Arenan (prototyp): ett tajmingspel där hjältens utrustning avgör. Tryck när pilen är i det gröna,
// helst i det gyllene. Kraft = skada, Skydd = liv, Tur = guldzon, Klurighet = grön zon, Snabbhet = lugnare pil.

type Phase = 'lobby' | 'aim' | 'enemy' | 'won' | 'lost';

export function Arenan() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [heroHp, setHeroHp] = useState(0);
  const [oppHp, setOppHp] = useState(0);
  const [msg, setMsg] = useState('');
  const [pose, setPose] = useState<{ who: 'hero' | 'opp'; n: number } | null>(null);
  const [prize, setPrize] = useState(0);
  /** Motståndaren i den här striden (stegen hinner flytta fram när man vinner). */
  const [foeRank, setFoeRank] = useState(0);
  const t0 = useRef(0);
  const marker = useRef<HTMLDivElement>(null);
  const s = p ? getHeroState(p.id) : null;
  const a = p ? arenaStats(heroStats(p.id), s!.arena.rank) : null;

  useEffect(() => {
    if (phase !== 'aim' || !a) return;
    t0.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (marker.current) marker.current.style.left = `${meterAt((now - t0.current) / 1000, a.speed) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (!p || !s || !a) { queueMicrotask(leaveToPicker); return null; }
  const next = opponentFor(s.arena.rank);
  const opp = phase === 'lobby' ? next : opponentFor(foeRank);
  const allBeaten = s.arena.rank >= OPPONENTS.length;

  function start() {
    if (!payToken(p!.id)) { toast('Du behöver en pollett 🎟️'); return; }
    setFoeRank(s!.arena.rank);
    setHeroHp(a!.hp); setOppHp(next.hp); setMsg(`${next.name} kliver in i arenan!`); setPose(null); setPrize(0);
    setPhase('aim');
    touch();
  }

  function strike() {
    if (phase !== 'aim') return;
    const sw: Swing = swingAt(meterAt((performance.now() - t0.current) / 1000, a!.speed), a!);
    const dmg = sw === 'crit' ? a!.dmg * 2 : sw === 'hit' ? a!.dmg : 0;
    const left = Math.max(0, oppHp - dmg);
    setOppHp(left);
    setMsg(sw === 'crit' ? `⭐ Fullträff! −${dmg}` : sw === 'hit' ? `💥 Träff! −${dmg}` : '💨 Miss!');
    if (dmg) setPose({ who: 'hero', n: Date.now() });
    if (left <= 0) {
      const b = winArena(p!.id, a!.bonusBlad);
      setPrize(b);
      setPhase('won');
      touch();
      return;
    }
    setPhase('enemy');
    const hp = Math.max(0, heroHp - a!.hurt);
    setTimeout(() => {
      setHeroHp(hp);
      setMsg(`${opp.icon} ${opp.name} slår tillbaka! −${a!.hurt}`);
      setPose({ who: 'opp', n: Date.now() });
      setPhase(hp <= 0 ? 'lost' : 'aim');
    }, 700);
  }

  const purse = <span class="purse">🌰 {s.kastanjer} · 🎟️ {s.polletter} · 🌸 {s.blad}</span>;

  if (phase === 'lobby') {
    return (
      <Screen class="place arena">
        <BackBar label="Azaleabyn" to="by" right={purse} />
        <div class="place-banner arena-banner"><span>🏟️</span><h1>Arenan</h1></div>
        <section class="card">
          <p>Här slåss din hjälte med sin utrustning. Tryck <b>Slå!</b> när pilen är i det gröna – mitt i det gyllene blir det fullträff!</p>
          <p class="muted small">En strid kostar en pollett 🎟️. Vinner du får du azaleablad 🌸 och möter nästa motståndare.</p>
          <div class="row center-row">
            <span>Du har {s.polletter} 🎟️</span>
            <button class="btn small" disabled={s.kastanjer < ARENA.tokenCost || s.polletter >= ARENA.maxTokens}
              onClick={() => { if (buyToken(p.id)) { toast('🎟️ En pollett!'); touch(); } }}>Köp pollett {ARENA.tokenCost} 🌰</button>
          </div>
        </section>
        <section class="card arena-next">
          <span class="arena-opp-icon">{opp.icon}</span>
          <div>
            <small class="muted">{allBeaten ? 'Du har besegrat alla! Utmana mästaren igen' : `Motståndare ${s.arena.rank + 1} av ${OPPONENTS.length}`}</small>
            <h2>{opp.name}</h2>
            <p class="muted small">❤️ {opp.hp} liv · slår {opp.atk}</p>
          </div>
          <button class="btn primary big" disabled={s.polletter < 1} onClick={start}>⚔️ Strid!</button>
        </section>
        <section class="card">
          <h3>Din utrustning i Arenan</h3>
          <ul class="arena-stats">
            <li>❤️ {a.hp} liv <small>(Skydd ger mer)</small></li>
            <li>⚔️ {a.dmg} skada per träff <small>(Kraft)</small></li>
            <li>🛡️ Du tar {a.hurt} skada per slag <small>(Skydd)</small></li>
            <li>🍀 Guldzon {Math.round(a.critZone * 100)} % <small>(Tur)</small></li>
            <li>💡 Grön zon {Math.round(a.hitZone * 100)} % <small>(Klurighet)</small></li>
            <li>⚡ Pilens fart {a.speed.toFixed(2)} <small>(Snabbhet gör den lugnare)</small></li>
            {a.bonusBlad > 0 && <li>🦉 +{a.bonusBlad} 🌸 extra när du vinner <small>(Visdom)</small></li>}
          </ul>
        </section>
      </Screen>
    );
  }

  const over = phase === 'won' || phase === 'lost';
  return (
    <Screen class="place arena">
      <BackBar label="Azaleabyn" to="by" right={purse} />
      <section class="card arena-fight">
        <div class="arena-side">
          <span key={pose?.who === 'opp' ? pose.n : 'h'} class={pose?.who === 'opp' ? 'shake' : ''}>
            <HeroFigure hid={p.id} size={92} pose={pose?.who === 'hero' ? 'attack' : null} />
          </span>
          <div class="hpbar"><div style={{ width: `${(heroHp / a.hp) * 100}%`, background: 'linear-gradient(90deg,#2f9e44,#69db7c)' }} /></div>
          <small>❤️ {heroHp}/{a.hp}</small>
        </div>
        <span class="arena-vs">VS</span>
        <div class="arena-side">
          <span key={pose?.who === 'hero' ? pose.n : 'o'} class={`arena-opp-icon big${pose?.who === 'hero' ? ' shake' : ''}`}>{opp.icon}</span>
          <div class="hpbar"><div style={{ width: `${(oppHp / opp.hp) * 100}%` }} /></div>
          <small>{opp.name} {oppHp}/{opp.hp}</small>
        </div>
      </section>
      <p class="arena-msg" aria-live="polite">{msg}</p>

      {!over && (
        <>
          <div class="meter" aria-hidden="true">
            <div class="meter-hit" style={{ width: `${a.hitZone * 100}%` }} />
            <div class="meter-crit" style={{ width: `${a.critZone * 100}%` }} />
            <div class="meter-marker" ref={marker} />
          </div>
          <div class="center"><button class="btn primary big" disabled={phase !== 'aim'} onClick={strike}>⚔️ Slå!</button></div>
        </>
      )}

      {over && (
        <section class="result-card">
          <div class="big-emoji">{phase === 'won' ? '🏆' : '💫'}</div>
          <h1>{phase === 'won' ? `Du besegrade ${opp.name}!` : `${opp.name} vann den här gången`}</h1>
          <p>{phase === 'won' ? `+${prize} 🌸 azaleablad.` : 'Bättre utrustning hjälper – träna och hitta skattkistor, och försök igen!'}</p>
          <div class="row center-row">
            <button class="btn" onClick={() => setPhase('lobby')}>Tillbaka</button>
            <button class="btn primary" disabled={s.polletter < 1} onClick={start}>Igen (1 🎟️)</button>
          </div>
        </section>
      )}
    </Screen>
  );
}
