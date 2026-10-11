import { useEffect } from 'preact/hooks';
import { gate, heroId, route, toasts } from './state';
import { initGate } from './platform/gate/gate';
import { listHeroes } from './platform/profiles';
import { selectHero } from './session';
import { Gate } from './shell/Gate';
import { HeroPicker } from './shell/HeroPicker';
import { NewHero } from './shell/NewHero';
import { IslandMap } from './shell/IslandMap';
import { Azaleabyn, RegionView } from './shell/Places';
import { AreaView } from './shell/AreaView';
import { PlayView } from './shell/PlayView';
import { Ovning } from './shell/Ovning';
import { LabbView } from './shell/LabbView';
import { Gard } from './shell/Gard';
import { ChestModal, Smedjan } from './shell/Loot';
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
  const [page, a, b] = route.value;
  const path = route.value.join('/');

  let view;
  if (!g) view = <div class="splash" aria-busy="true">🌸</div>;
  else if (!g.state.opened || page === 'porten') view = <Gate />;
  else if (page === 'vuxen') view = <Vuxen />;
  else if (page === 'ny') view = <NewHero />;
  else if (!heroId.value || page === 'hjaltar') view = <HeroPicker />;
  else if (page === 'gard') view = <Gard />;
  else if (page === 'by') view = <Azaleabyn />;
  else if (page === 'smedjan') view = <Smedjan />;
  else if (page === 'region' && a) view = <RegionView id={a} />;
  else if (page === 'omrade' && a) view = <AreaView id={a} />;
  // key = sökvägen, så att en ny bana alltid får ett nytt spel-tillstånd
  else if (page === 'spela' && a && b) view = <PlayView key={path} areaId={a} nodeId={b} />;
  else if (page === 'ovning' && a && b) view = <PlayView key={path} areaId={a} nodeId={b} practice />;
  else if (page === 'ovning') view = <Ovning />;
  else if (page === 'labb' && a) view = <LabbView areaId={a} tab={b ?? ''} />;
  else view = <IslandMap />;

  return (
    <>
      {view}
      <ChestModal />
      <div class="toasts" aria-live="polite">
        {toasts.value.map((t) => <div class="toast" key={t.id}>{t.text}</div>)}
      </div>
    </>
  );
}
