import { go } from '../state';
import { FreePractice, Tolkaren } from '../games/klocka/ui/Labb';
import { BackBar, Screen } from './ui';

// Tidslabbet (fri övning och tolkaren) för Tidstornet.
export function LabbView({ areaId, tab }: { areaId: string; tab: string }) {
  if (areaId !== 'tidstornet') { queueMicrotask(() => go('karta')); return null; }
  return (
    <Screen class="place">
      <BackBar label="Tidstornet" to="omrade/tidstornet" />
      <h1 class="page-title">🧪 Tidslabbet</h1>
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected={tab !== 'tolka'} class={tab !== 'tolka' ? 'on' : ''} onClick={() => go(`labb/${areaId}`)}>Öva fritt</button>
        <button role="tab" aria-selected={tab === 'tolka'} class={tab === 'tolka' ? 'on' : ''} onClick={() => go(`labb/${areaId}/tolka`)}>Tolka en tid</button>
      </div>
      {tab === 'tolka' ? <Tolkaren /> : <FreePractice />}
    </Screen>
  );
}
