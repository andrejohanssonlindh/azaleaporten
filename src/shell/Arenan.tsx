import { useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { randomSeed } from '../platform/rng';
import { DUEL_OFFHANDS, DUEL_WEAPONS, duelLoadout, MOVES, OPPONENTS, payToken, winArena } from '../platform/rpg/arena';
import { leaveToPicker } from '../session';
import { giveSkattkistor, grantSpelTitlar, payKey } from '../platform/rpg/nycklar';
import { KEYS } from '../platform/rpg/balance';
import { HeroFigure } from './HeroFigure';
import { Purse, TokenRow } from './Polletter';
import { BackBar, Screen } from './ui';
import { Loading, useLoaded } from './useGame';
import type { DuelWin } from '../minigames/duell/View';

// Arenan: Bossduellen. Välj var på stegen kvällen börjar (nästa motståndare eller ett returmöte),
// betala en pollett och möt motståndare efter motståndare tills du förlorar eller går hem.
// Varje vinst sparas direkt. Själva duellen laddas först när den startar.

const loadDuel = () => import('../minigames/duell/View');

type Run = { start: number; seed: number; skatt: boolean };

export function Arenan() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [run, setRun] = useState<Run | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [result, setResult] = useState<{ beaten: number[]; blad: number; skatter: number; titles: string[] } | null>(null);
  const [blad, setBlad] = useState(0);
  const [skatter, setSkatter] = useState(0);

  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const next = Math.min(s.arena.rank, OPPONENTS.length - 1);
  const chosen = Math.min(pick ?? next, next);

  function start(withKey = false) {
    if (withKey ? !payKey(p!.id) : !payToken(p!.id)) { toast(withKey ? 'Du behöver en spelnyckel 🗝️' : 'Du behöver en pollett 🎟️'); return; }
    setResult(null);
    setBlad(0);
    setSkatter(0);
    setRun({ start: chosen, seed: randomSeed(), skatt: withKey });
    touch();
  }

  function win(w: DuelWin) {
    const got = winArena(p!.id, w.foe, w.flawless);
    setBlad((b) => b + got);
    // Skattkväll: varje vinst ger en skattkista (sparas direkt, som vinsten).
    if (run?.skatt && skatter < KEYS.chestsPerRun) {
      giveSkattkistor(p!.id, 1, 'Arenan');
      setSkatter((n) => n + 1);
      toast('🎁 En skattkista!');
    }
    touch();
    return got;
  }

  if (run) return <DuelRun hid={p.id} run={run} onWin={win} onEnd={(beaten) => { setResult({ beaten, blad, skatter, titles: grantSpelTitlar(p.id) }); setRun(null); setPick(null); touch(); }} />;

  const lo = duelLoadout(p.id);
  const allBeaten = s.arena.rank >= OPPONENTS.length;
  return (
    <Screen class="place arena">
      <BackBar label="Spelön" to="spelon" right={<Purse hid={p.id} />} />
      <div class="place-banner arena-banner"><span>🏟️</span><h1>Arenan</h1></div>

      {result && (
        <section class="result-card">
          <div class="big-emoji">{result.beaten.length ? '🏆' : '💫'}</div>
          <h1>{result.beaten.length ? `Du vann ${result.beaten.length} ${result.beaten.length === 1 ? 'strid' : 'strider'}!` : 'Ingen vinst den här kvällen'}</h1>
          {result.beaten.length > 0 && <p>{result.beaten.map((i) => OPPONENTS[i].icon).join(' ')} · +{result.blad} 🌸</p>}
          {result.skatter > 0 && <p>🎁 {result.skatter} skattkist{result.skatter === 1 ? 'a' : 'or'} – öppna i Azaleagården!</p>}
          {result.titles.map((t) => <p key={t}>🏷️ Ny titel: {t}</p>)}
          {!result.beaten.length && <p class="muted small">Tips: hoppa precis innan de röda banorna är fyllda. Bättre utrustning hjälper också!</p>}
        </section>
      )}

      <section class="card storm-start">
        <HeroFigure hid={p.id} size={84} />
        <div>
          <p>Bossduellen! Motståndaren visar med <b>röda banor</b> var slaget kommer. Hoppa undan eller blockera, och slå tillbaka när den är yr 💫. En pollett räcker hela kvällen: du möter motståndare efter motståndare tills du förlorar.</p>
          <div class="row center-row">
            <button class="btn primary big" disabled={s.polletter < 1} onClick={() => start()}>⚔️ Mot {OPPONENTS[chosen].icon} {OPPONENTS[chosen].name} (1 🎟️)</button>
            {s.nycklar > 0 && <button class="btn big" onClick={() => start(true)}>🗝️ Skattkväll</button>}
          </div>
          {s.nycklar > 0 && <p class="small">🗝️ En skattkväll kostar en spelnyckel i stället för en pollett. Varje vinst ger en skattkista 🎁 (högst {KEYS.chestsPerRun})!</p>}
          <TokenRow hid={p.id} />
        </div>
      </section>

      <section class="card">
        <h3>Stegen</h3>
        <ol class="duel-ladder">
          {OPPONENTS.map((o, i) => {
            const done = i < s.arena.rank, open = i <= next;
            return (
              <li key={o.name}>
                <button class={`duel-rung${i === chosen ? ' on' : ''}${open ? '' : ' locked'}`} disabled={!open} aria-pressed={i === chosen} onClick={() => setPick(i)}>
                  <span class="duel-rung-icon">{open ? o.icon : '🔒'}</span>
                  <span><b>{o.name}</b>{done ? ' ✓' : ''}<br /><small>{open ? o.tip : 'Besegra den förra först'}</small></span>
                  {open && <small class="duel-rung-moves">{o.moves.map((m) => MOVES[m].name).join(' · ')}</small>}
                </button>
              </li>
            );
          })}
        </ol>
        <p class="muted small">{allBeaten ? 'Du har besegrat alla! Utmana vem du vill igen.' : 'Returmöten mot de du redan besegrat ger 1 🌸 (2 utan en skråma).'} Vinster: {s.arena.wins}</p>
      </section>

      <section class="card">
        <h3>Din utrustning i Arenan</h3>
        <ul class="arena-stats">
          <li>{lo.weaponIcon} <b>{DUEL_WEAPONS[lo.weapon].name}</b>: {DUEL_WEAPONS[lo.weapon].does}</li>
          {lo.off ? <li>{lo.off === 'skold' ? '🛡️' : lo.off === 'trollbok' ? '📕' : '🏮'} {DUEL_OFFHANDS[lo.off]}</li> : <li class="muted">🛡️ Utan sköld tar du mindre skada när du blockerar, men inte noll</li>}
          {lo.pet && <li>{lo.pet} <b>Husdjuret</b> biter när motståndaren är yr</li>}
          <li>❤️ {lo.maxHp} liv{lo.armor > 0 && <>, tar {lo.armor} mindre skada per slag</>} <small>(Skydd)</small></li>
          <li>⚔️ {lo.dmg} skada per slag <small>(Kraft)</small></li>
          <li>⚡ {lo.atkCd} s mellan slagen <small>(Snabbhet)</small></li>
          <li>🍀 {Math.round(lo.crit * 100)} % fullträffar <small>(Tur)</small></li>
          <li>💡 Du ser slagen {Math.round((lo.windMult - 1) * 100)} % längre <small>(Klurighet)</small></li>
          <li>🦉 Superslaget laddas efter {Math.ceil(1 / lo.charge)} undanhopp <small>(Visdom)</small></li>
        </ul>
      </section>
    </Screen>
  );
}

function DuelRun({ hid, run, onWin, onEnd }: { hid: string; run: Run; onWin: (w: DuelWin) => number; onEnd: (beaten: number[]) => void }) {
  const mod = useLoaded('duell', loadDuel);
  if (mod === 'laddar' || mod === 'fel') return <Loading failed={mod === 'fel'} back="spelon" />;
  const Game = mod.default;
  return (
    <Screen class="place arena">
      <Game hid={hid} start={run.start} seed={run.seed} onWin={onWin} onEnd={onEnd} />
    </Screen>
  );
}
