import { useEffect, useRef, useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { randomSeed } from '../platform/rng';
import { ARENA, buyToken, payToken } from '../platform/rpg/arena';
import { finishStorm, OFFHANDS, STORM_WAVES, stormLoadout, WEAPONS } from '../platform/rpg/dimstorm';
import { leaveToPicker } from '../session';
import { HeroFigure } from './HeroFigure';
import { BackBar, Screen } from './ui';
import { Loading, useLoaded } from './useGame';
import type { Game } from '../minigames/dimstorm/sim';
import type { StormResult } from '../minigames/dimstorm/View';

// Dimstormen i Azaleabyn: förberedelser (polletter, steg, vad utrustningen gör), själva stormen
// (laddas först när den startar) och resultatet. Ger bara azaleablad.

const loadStorm = () => import('../minigames/dimstorm/View');

type Run = { steg: number; seed: number };

export function Dimstormen() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [run, setRun] = useState<Run | null>(null);
  const [result, setResult] = useState<(StormResult & { steg: number; blad: number; opened: boolean }) | null>(null);
  const [steg, setSteg] = useState<number | null>(null);
  /** Stormen som pågår. Lämnar barnet sidan mitt i sparas det som hunnits plocka. */
  const live = useRef<Game | null>(null);
  const saved = useRef(true);

  useEffect(() => () => {
    const g = live.current;
    if (p && g && !saved.current) finishStorm(p.id, { steg: g.steg, waves: Math.min(STORM_WAVES, g.wave - 1), won: false, picked: g.picked });
  }, []);

  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const chosen = Math.min(steg ?? s.storm.steg, s.storm.steg);
  const purse = <span class="purse">🌰 {s.kastanjer} · 🎟️ {s.polletter} · 🌸 {s.blad}</span>;

  function start() {
    if (!payToken(p!.id)) { toast('Du behöver en pollett 🎟️'); return; }
    saved.current = false;
    live.current = null;
    setResult(null);
    setRun({ steg: chosen, seed: randomSeed() });
    touch();
  }

  function end(r: StormResult) {
    if (saved.current) return;
    saved.current = true;
    const before = getHeroState(p!.id).storm.steg;
    const blad = finishStorm(p!.id, { steg: run!.steg, waves: r.waves, won: r.won, picked: r.picked });
    const opened = getHeroState(p!.id).storm.steg > before;
    setResult({ ...r, steg: run!.steg, blad, opened });
    setRun(null);
    if (opened) setSteg(null);
    touch();
  }

  if (run) return <StormRun hid={p.id} run={run} live={live} onEnd={end} />;

  const lo = stormLoadout(p.id);
  return (
    <Screen class="place storm-place">
      <BackBar label="Azaleabyn" to="by" right={purse} />
      <div class="place-banner storm-banner"><span>🌪️</span><h1>Dimstormen</h1></div>

      {result && (
        <section class="result-card">
          <div class="big-emoji">{result.won ? '🏆' : '🌫️'}</div>
          <h1>{result.won ? `Du klarade steg ${result.steg}!` : result.waves ? `Du klarade ${result.waves} ${result.waves === 1 ? 'våg' : 'vågor'}` : 'Dimman var för stark den här gången'}</h1>
          <p>+{result.blad} 🌸 azaleablad · {result.kills} monster · nivå {result.lvl}</p>
          {result.opened && <p><b>Steg {result.steg + 1} är öppet!</b> Där tål monstren mer och slår hårdare.</p>}
          {!result.won && <p class="muted small">Tips: spring runt och låt monstren komma till dig. Bättre utrustning hjälper också!</p>}
        </section>
      )}

      <section class="card storm-start">
        <HeroFigure hid={p.id} size={84} />
        <div>
          <p>Monster väller ut ur Glömskans dimma! Spring runt med din hjälte – den slåss själv med sin utrustning. Klara {STORM_WAVES} vågor och besegra Stormjätten.</p>
          {s.storm.steg > 1 && (
            <div class="storm-steps" role="group" aria-label="Välj steg">
              {Array.from({ length: s.storm.steg }, (_, i) => i + 1).slice(-6).map((n) => (
                <button key={n} class={`chip${n === chosen ? ' on' : ''}`} aria-pressed={n === chosen} onClick={() => setSteg(n)}>Steg {n}</button>
              ))}
            </div>
          )}
          <div class="row center-row">
            <button class="btn primary big" disabled={s.polletter < 1} onClick={start}>🌪️ Starta steg {chosen} (1 🎟️)</button>
          </div>
          <div class="row center-row">
            <span class="small">Du har {s.polletter} 🎟️</span>
            <button class="btn small" disabled={s.kastanjer < ARENA.tokenCost || s.polletter >= ARENA.maxTokens}
              onClick={() => { if (buyToken(p.id)) { toast('🎟️ En pollett!'); touch(); } }}>Köp pollett {ARENA.tokenCost} 🌰</button>
          </div>
          <p class="muted small">Klarar du alla dagens uppdrag får du {ARENA.dailyTokens} polletter. Stormen ger azaleablad 🌸: de du plockar, ett per våg och extra om du vinner.</p>
        </div>
      </section>

      <section class="card">
        <h3>Så slåss du i stormen</h3>
        <ul class="arena-stats">
          <li>{lo.weaponIcon} <b>{WEAPONS[lo.weapon].name}</b>: {WEAPONS[lo.weapon].does}</li>
          {lo.off ? <li>{lo.offIcon} <b>{OFFHANDS[lo.off].name}</b>: {OFFHANDS[lo.off].does}</li> : <li class="muted">🛡️ Ingen sköld, bok eller lykta än</li>}
          {lo.pet ? <li>{lo.pet} <b>Husdjuret</b> hoppar på monster nära dig</li> : <li class="muted">🐾 Inget husdjur än (tämj en boss!)</li>}
          <li>❤️ {lo.maxHp} liv <small>(Skydd)</small>{lo.armor > 0 && <> · tar {lo.armor} mindre skada per slag</>}</li>
          <li>⚔️ {Math.round(lo.dmgMult * 100)} % skada <small>(Kraft)</small></li>
          <li>⚡ {Math.round((1 / lo.cdMult - 1) * 100)} % snabbare attacker, fart {lo.moveSpeed} <small>(Snabbhet)</small></li>
          <li>🍀 {Math.round(lo.crit * 100)} % fullträffar, fler 🌸 att plocka <small>(Tur)</small></li>
          <li>💡 Plockar upp på {lo.magnet} stegs håll{lo.choices > 3 && ', och väljer bland 4 krafter'} <small>(Klurighet)</small></li>
          <li>🦉 +{Math.round((lo.xpMult - 1) * 100)} % kristaller, så du blir starkare fortare <small>(Visdom)</small></li>
        </ul>
        {(s.storm.wins > 0 || s.storm.steg > 1) && <p class="muted small">Vinster: {s.storm.wins} · högsta klarade steg: {s.storm.best}</p>}
      </section>
    </Screen>
  );
}

function StormRun({ hid, run, live, onEnd }: { hid: string; run: Run; live: { current: Game | null }; onEnd: (r: StormResult) => void }) {
  const mod = useLoaded('dimstorm', loadStorm);
  if (mod === 'laddar' || mod === 'fel') return <Loading failed={mod === 'fel'} back="by" />;
  const Game = mod.default;
  return (
    <Screen class="place storm-place">
      <Game hid={hid} steg={run.steg} seed={run.seed} live={live} onEnd={onEnd} />
    </Screen>
  );
}
