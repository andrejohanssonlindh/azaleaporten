import { useEffect, useRef, useState } from 'preact/hooks';
import { dataRev, heroId, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { randomSeed } from '../platform/rng';
import { payToken } from '../platform/rpg/arena';
import { giveSkattkistor, grantSpelTitlar, payKey } from '../platform/rpg/nycklar';
import { finishKnut, KNUT_OFFHANDS, KNUT_WEAPONS, knutLoadout, knutResult, knutStarts, type KnutResult } from '../platform/rpg/trassel';
import { leaveToPicker } from '../session';
import { HeroFigure } from './HeroFigure';
import { Purse, TokenRow } from './Polletter';
import { BackBar, Screen } from './ui';
import { Loading, useLoaded } from './useGame';
import type { Game } from '../minigames/trassel/sim';

// Trasselvinden på Spelön: förberedelser, själva spelet (laddas först när det startar) och resultatet.
// Lämnar barnet sidan mitt i en runda sparas det som samlats, som om barnet hade tryckt på Lämna.

const loadKnut = () => import('../minigames/trassel/View');

export function Trasselvinden() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [run, setRun] = useState<{ seed: number; start: number; skatt: boolean } | null>(null);
  const [result, setResult] = useState<(KnutResult & { record: boolean; titles: string[] }) | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const live = useRef<Game | null>(null);
  const saved = useRef(true);

  useEffect(() => () => {
    const g = live.current;
    if (p && g && !saved.current) {
      const r = knutResult(g);
      finishKnut(p.id, r);
      giveSkattkistor(p.id, r.skatter, 'Trasselvinden');
      grantSpelTitlar(p.id);
    }
  }, []);

  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const starts = knutStarts(s.trassel.best);
  const from = start !== null && starts.includes(start) ? start : starts.at(-1)!;

  function begin(withKey = false) {
    if (withKey ? !payKey(p!.id) : !payToken(p!.id)) { toast(withKey ? 'Du behöver en spelnyckel 🗝️' : 'Du behöver en pollett 🎟️'); return; }
    saved.current = false;
    live.current = null;
    setResult(null);
    setRun({ seed: randomSeed(), start: from, skatt: withKey });
    touch();
  }

  function end(r: KnutResult) {
    if (saved.current) return;
    saved.current = true;
    const record = r.best > getHeroState(p!.id).trassel.best;
    finishKnut(p!.id, r);
    giveSkattkistor(p!.id, r.skatter, 'Trasselvinden');
    const titles = grantSpelTitlar(p!.id);
    setResult({ ...r, record, titles });
    setRun(null);
    touch();
  }

  if (run) return <KnutRun hid={p.id} {...run} live={live} onEnd={end} />;

  const lo = knutLoadout(p.id);
  return (
    <Screen class="place knut-place">
      <BackBar label="Spelön" to="spelon" right={<Purse hid={p.id} />} />
      <div class="place-banner knut-banner"><span>🪢</span><h1>Trasselvinden</h1></div>

      {result && (
        <section class="result-card">
          <div class="big-emoji">{result.fell ? '💫' : '🏡'}</div>
          <h1>{result.solved ? `Du löste ${result.solved} knut${result.solved === 1 ? '' : 'ar'}!` : 'Knuten vann den här gången'}</h1>
          <p>+{result.blad} 🌸 azaleablad · {result.kills} monster</p>
          {result.record && <p><b>Nytt rekord: knut {result.best}!</b></p>}
          {result.skatter > 0 && <p>🎁 {result.skatter} skattkist{result.skatter === 1 ? 'a' : 'or'} – öppna i Azaleagården!</p>}
          {result.titles.map((t) => <p key={t}>🏷️ Ny titel: {t}</p>)}
          {result.fell && <p class="muted small">Tips: slå bort monstren när de kommer, och använd en klurig knuff 💡 när du kör fast.</p>}
        </section>
      )}

      <section class="card storm-start">
        <HeroFigure hid={p.id} size={84} />
        <div>
          <p>Uppe på vinden har alla rep trasslat ihop sig. <b>Dra pinnarna</b> tills inga rep korsar varandra. Varje knut är lite större än den förra. Men se upp: vindsmonstren gillar trassel!</p>
          {starts.length > 1 && (
            <div class="row center-row knut-starts" role="group" aria-label="Börja vid knut">
              <span class="small">Börja vid:</span>
              {starts.map((l) => <button key={l} class={`btn small${l === from ? ' primary' : ''}`} aria-pressed={l === from} onClick={() => setStart(l)}>Knut {l}</button>)}
            </div>
          )}
          <div class="row center-row">
            <button class="btn primary big" disabled={s.polletter < 1} onClick={() => begin()}>🪢 Klättra upp (1 🎟️)</button>
            {s.nycklar > 0 && <button class="btn big" onClick={() => begin(true)}>🗝️ Skattrunda</button>}
          </div>
          {s.nycklar > 0 && <p class="small">🗝️ En skattrunda kostar en spelnyckel i stället för en pollett. Då gömmer sig skattkistor 🎁 i knutarna!</p>}
          <TokenRow hid={p.id} />
          {s.trassel.runs > 0 && <p class="muted small">Högsta lösta knut: {s.trassel.best} · {s.trassel.runs} rundor</p>}
        </div>
      </section>

      <section class="card">
        <h3>Så hjälper din utrustning</h3>
        <ul class="arena-stats">
          <li>{lo.weaponIcon} <b>{KNUT_WEAPONS[lo.weapon].name}</b>: {KNUT_WEAPONS[lo.weapon].does}</li>
          {lo.off ? <li>{lo.offIcon} <b>{KNUT_OFFHANDS[lo.off].name}</b>: {KNUT_OFFHANDS[lo.off].does}</li> : <li class="muted">🛡️ Ingen sköld, bok eller lykta än</li>}
          {lo.pet ? <li>{lo.pet} <b>Husdjuret</b> biter monstret som är närmast dig ibland</li> : <li class="muted">🐾 Inget husdjur än (tämj en boss!)</li>}
          <li>❤️ {lo.maxHp} liv{lo.armor > 0 && <>, tar {lo.armor} mindre skada per bett</>} <small>(Skydd)</small></li>
          <li>⚔️ {lo.dmg} skada per slag <small>(Kraft)</small></li>
          <li>⚡ Ett slag var {lo.cd.toLocaleString('sv')} sekund <small>(Snabbhet)</small></li>
          <li>🍀 {Math.round(lo.crit * 100)} % fullträffar, {Math.round(lo.bladChance * 100)} % chans att monster tappar blad <small>(Tur)</small></li>
          <li>💡 {lo.hints} klurig{lo.hints === 1 ? '' : 'a'} knuff{lo.hints === 1 ? '' : 'ar'} per runda <small>(Klurighet)</small></li>
          <li>🦉 +{lo.heal} liv för varje löst knut <small>(Visdom)</small></li>
        </ul>
      </section>
    </Screen>
  );
}

function KnutRun({ hid, seed, start, skatt, live, onEnd }: { hid: string; seed: number; start: number; skatt: boolean; live: { current: Game | null }; onEnd: (r: KnutResult) => void }) {
  const mod = useLoaded('trassel', loadKnut);
  if (mod === 'laddar' || mod === 'fel') return <Loading failed={mod === 'fel'} back="spelon" />;
  const Game = mod.default;
  return (
    <Screen class="place knut-place">
      <Game hid={hid} seed={seed} start={start} skatt={skatt} live={live} onEnd={onEnd} />
    </Screen>
  );
}
