import { useState } from 'preact/hooks';
import { gate, go } from '../state';
import { initGate, openPublic, openWithPassword } from '../platform/gate/gate';
import { listHeroes } from '../platform/profiles';
import { selectHero } from '../session';
import { GateArt } from './GateArt';

const reduceMotion = () => matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function Gate() {
  const g = gate.value!;
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  const askPassword = g.packAvailable && (g.needsPassword || !g.state.opened);

  async function enter() {
    setOpening(true);
    await new Promise((r) => setTimeout(r, reduceMotion() ? 0 : 1100));
    gate.value = await initGate();
    const heroes = listHeroes();
    if (heroes.length === 1) { selectHero(heroes[0].id); go('karta'); }
    else go(heroes.length ? 'hjaltar' : 'ny');
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (!pw.trim() || busy) return;
    setBusy(true);
    setError(false);
    const pack = await openWithPassword(pw);
    setBusy(false);
    if (pack) enter();
    else { setError(true); setPw(''); }
  }

  function withoutPassword() {
    openPublic();
    enter();
  }

  return (
    <main class={`gate${opening ? ' opening' : ''}`}>
      <div class="gate-stars" aria-hidden="true" />
      <h1 class="gate-title">Azaleaporten</h1>
      <p class="gate-sub">Ett äventyr i matte, svenska och engelska</p>
      <GateArt open={opening} />
      {askPassword ? (
        <form class={`gate-form${error ? ' shake' : ''}`} onSubmit={submit}>
          <label for="gate-pw">Viska portens lösenord</label>
          <input
            id="gate-pw" type="password" autocomplete="current-password" autocapitalize="none" spellcheck={false}
            value={pw} onInput={(e) => { setPw(e.currentTarget.value); setError(false); }} disabled={busy || opening} autoFocus
          />
          <button class="btn primary big" disabled={busy || opening || !pw.trim()}>{busy ? 'Porten lyssnar…' : 'Öppna porten'}</button>
          <p class="gate-error" role="alert">{error ? 'Porten förblir stängd. Försök igen!' : ''}</p>
          {g.state.opened ? (
            <button type="button" class="link" onClick={() => go(listHeroes().length ? 'hjaltar' : 'ny')}>Tillbaka</button>
          ) : (
            <button type="button" class="link" onClick={withoutPassword}>Jag har inget lösenord</button>
          )}
        </form>
      ) : (
        <div class="gate-form">
          <button class="btn primary big" onClick={withoutPassword} disabled={opening}>Öppna porten</button>
        </div>
      )}
    </main>
  );
}
