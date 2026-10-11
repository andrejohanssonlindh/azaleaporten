import { useEffect } from 'preact/hooks';
import { gate, heroId, route, toasts } from './state';
import { initGate } from './platform/gate/gate';
import { listHeroes } from './platform/profiles';
import { selectHero } from './session';
import { Gate } from './shell/Gate';
import { HeroPicker } from './shell/HeroPicker';
import { NewHero } from './shell/NewHero';
import { WorldMap } from './shell/WorldMap';
import { Gard } from './shell/Gard';
import { Vuxen } from './shell/Vuxen';

let started = false;
async function start() {
  if (started) return;
  started = true;
  const status = await initGate();
  // En enda hjälte på enheten: gå direkt in. Annars får man välja.
  const heroes = listHeroes();
  if (status.state.opened && heroes.length === 1) selectHero(heroes[0].id);
  gate.value = status;
}

export function App() {
  useEffect(() => { start(); }, []);
  const g = gate.value;
  const [page] = route.value;

  let view;
  if (!g) view = <div class="splash" aria-busy="true">🌸</div>;
  else if (!g.state.opened || page === 'porten') view = <Gate />;
  else if (page === 'vuxen') view = <Vuxen />;
  else if (page === 'ny') view = <NewHero />;
  else if (!heroId.value || page === 'hjaltar') view = <HeroPicker />;
  else if (page === 'gard') view = <Gard />;
  else view = <WorldMap />;

  return (
    <>
      {view}
      <div class="toasts" aria-live="polite">
        {toasts.value.map((t) => <div class="toast" key={t.id}>{t.text}</div>)}
      </div>
    </>
  );
}
