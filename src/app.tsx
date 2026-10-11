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
import { Uppdrag } from './shell/Uppdrag';
import { Biblioteket } from './shell/Biblioteket';
import { LabbView } from './shell/LabbView';
import { Gard } from './shell/Gard';
import { ChestModal, Smedjan } from './shell/Loot';
import { Vuxen } from './shell/Vuxen';
import { Skraddaren } from './shell/Skraddaren';
import { Arenan } from './shell/Arenan';
import { Dimstormen } from './shell/Dimstormen';
import { Grottdyket } from './shell/Grottdyket';
import { pausedByOtherTab, takeOverTab } from './platform/tabs';
import { Mentor, Screen } from './shell/ui';

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

  // En annan flik har tagit över: visa bara det här, så att inget i den här fliken kan skriva över.
  if (pausedByOtherTab.value) {
    return (
      <Screen class="place">
        <Mentor text="Azaleaporten öppnades i en annan flik eller ett annat fönster. Där fortsätter äventyret, så den här fliken vilar.">
          <button class="btn primary" onClick={takeOverTab}>Spela här i stället</button>
        </Mentor>
      </Screen>
    );
  }

  let view;
  if (!g) view = <div class="splash" aria-busy="true">🌸</div>;
  else if (!g.state.opened || page === 'porten') view = <Gate />;
  else if (page === 'vuxen') view = <Vuxen />;
  else if (page === 'ny') view = <NewHero />;
  else if (!heroId.value || page === 'hjaltar') view = <HeroPicker />;
  else if (page === 'gard') view = <Gard tab={a} />;
  else if (page === 'by') view = <Azaleabyn />;
  else if (page === 'smedjan') view = <Smedjan />;
  else if (page === 'skraddaren') view = <Skraddaren />;
  else if (page === 'arenan') view = <Arenan />;
  else if (page === 'dimstormen') view = <Dimstormen />;
  else if (page === 'grottdyket') view = <Grottdyket />;
  else if (page === 'region' && a) view = <RegionView id={a} />;
  else if (page === 'omrade' && a) view = <AreaView id={a} />;
  // key = sökvägen, så att en ny bana alltid får ett nytt spel-tillstånd
  else if (page === 'spela' && a && b) view = <PlayView key={path} areaId={a} nodeId={b} />;
  else if (page === 'ovning' && a && b) view = <PlayView key={path} areaId={a} nodeId={b} practice />;
  else if (page === 'repetera' && a) view = <PlayView key={path} areaId={a} nodeId="dimma" review />;
  else if (page === 'veckans') view = <PlayView key={path} areaId="stavningstrasket" nodeId="veckans" veckans />;
  else if (page === 'ovning') view = <Ovning />;
  else if (page === 'uppdrag') view = <Uppdrag />;
  else if (page === 'biblioteket') view = <Biblioteket />;
  else if (page === 'labb' && a) view = <LabbView key={a} areaId={a} tab={b ?? ''} />;
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
