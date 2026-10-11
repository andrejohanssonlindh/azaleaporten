import { useEffect, useRef, useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { randomSeed } from '../platform/rng';
import { payToken } from '../platform/rpg/arena';
import { CAVE_OFFHANDS, CAVE_WEAPONS, caveLoadout, finishCave } from '../platform/rpg/grotta';
import { leaveToPicker } from '../session';
import { HeroFigure } from './HeroFigure';
import { Purse, TokenRow } from './Polletter';
import { BackBar, Screen } from './ui';
import { Loading, useLoaded } from './useGame';
import type { Cave } from '../minigames/grotta/sim';
import type { CaveResult } from '../minigames/grotta/View';

// Grottdyket i Azaleabyn: förberedelser, själva dyket (laddas först när det startar) och resultatet.
// Lämnar barnet sidan mitt i ett dyk räknas det som att falla: hälften av skatten sparas.

const loadCave = () => import('../minigames/grotta/View');

export function Grottdyket() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [seed, setSeed] = useState<number | null>(null);
  const [result, setResult] = useState<(CaveResult & { got: number; record: boolean }) | null>(null);
  const live = useRef<Cave | null>(null);
  const saved = useRef(true);

  useEffect(() => () => {
    const c = live.current;
    if (p && c && !saved.current) finishCave(p.id, { depth: c.depth, blad: c.blad, home: false });
  }, []);

  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);

  function start() {
    if (!payToken(p!.id)) { toast('Du behöver en pollett 🎟️'); return; }
    saved.current = false;
    live.current = null;
    setResult(null);
    setSeed(randomSeed());
    touch();
  }

  function end(r: CaveResult) {
    if (saved.current) return;
    saved.current = true;
    const record = r.depth > getHeroState(p!.id).grotta.best;
    const got = finishCave(p!.id, r);
    setResult({ ...r, got, record });
    setSeed(null);
    touch();
  }

  if (seed !== null) return <CaveRun hid={p.id} seed={seed} live={live} onEnd={end} />;

  const lo = caveLoadout(p.id);
  return (
    <Screen class="place cave-place">
      <BackBar label="Azaleabyn" to="by" right={<Purse hid={p.id} />} />
      <div class="place-banner cave-banner"><span>⛏️</span><h1>Grottdyket</h1></div>

      {result && (
        <section class="result-card">
          <div class="big-emoji">{result.home ? '🏡' : '💫'}</div>
          <h1>{result.home ? `Hemma med skatten från våning ${result.depth}!` : `Du föll på våning ${result.depth}`}</h1>
          <p>+{result.got} 🌸 azaleablad{!result.home && result.blad > 0 ? ` (hälften av ${result.blad})` : ''} · {result.kills} monster</p>
          {result.record && <p><b>Nytt rekord: våning {result.depth}!</b></p>}
          {!result.home && <p class="muted small">Tips: vid trappan kan du gå hem med allt. Läkedrycker 🧪 räddar dig när livet är lågt.</p>}
        </section>
      )}

      <section class="card storm-start">
        <HeroFigure hid={p.id} size={84} />
        <div>
          <p>Under Azaleabyn finns en djup grotta full av monster och skatter. Hur djupt vågar du gå? Vid varje trappa väljer du: <b>djupare</b>, eller <b>hem med skatten</b>. Faller du får du bara behålla hälften.</p>
          <div class="row center-row">
            <button class="btn primary big" disabled={s.polletter < 1} onClick={start}>⛏️ Kliv ner (1 🎟️)</button>
          </div>
          <TokenRow hid={p.id} />
          {s.grotta.dives > 0 && <p class="muted small">Djupast hittills: våning {s.grotta.best} · {s.grotta.dives} dyk</p>}
        </div>
      </section>

      <section class="card">
        <h3>Så slåss du i grottan</h3>
        <ul class="arena-stats">
          <li>{lo.weaponIcon} <b>{CAVE_WEAPONS[lo.weapon].name}</b>: {CAVE_WEAPONS[lo.weapon].does}</li>
          {lo.off ? <li>{lo.offIcon} <b>{CAVE_OFFHANDS[lo.off].name}</b>: {CAVE_OFFHANDS[lo.off].does}</li> : <li class="muted">🛡️ Ingen sköld, bok eller lykta än</li>}
          {lo.pet ? <li>{lo.pet} <b>Husdjuret</b> biter ibland monster bredvid dig</li> : <li class="muted">🐾 Inget husdjur än (tämj en boss!)</li>}
          <li>❤️ {lo.maxHp} liv{lo.armor > 0 && <>, tar {lo.armor} mindre skada per slag</>} <small>(Skydd)</small></li>
          <li>⚔️ {lo.dmg} skada per slag <small>(Kraft)</small></li>
          <li>🍀 {Math.round(lo.crit * 100)} % fullträffar <small>(Tur)</small></li>
          <li>⚡ {Math.round(lo.haste * 100)} % chans att monstren inte hinner röra sig <small>(Snabbhet)</small></li>
          <li>💡 {Math.round(lo.spot * 100)} % chans per drag att se gömda fällor <small>(Klurighet)</small></li>
          <li>🦉 Läkedrycker ger {lo.potionHeal} liv{lo.potions > 0 && <>, och du börjar med {lo.potions}</>} <small>(Visdom)</small></li>
        </ul>
      </section>
    </Screen>
  );
}

function CaveRun({ hid, seed, live, onEnd }: { hid: string; seed: number; live: { current: Cave | null }; onEnd: (r: CaveResult) => void }) {
  const mod = useLoaded('grotta', loadCave);
  if (mod === 'laddar' || mod === 'fel') return <Loading failed={mod === 'fel'} back="by" />;
  const Game = mod.default;
  return (
    <Screen class="place cave-place">
      <Game hid={hid} seed={seed} live={live} onEnd={onEnd} />
    </Screen>
  );
}
