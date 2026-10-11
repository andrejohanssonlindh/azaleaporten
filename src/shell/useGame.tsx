import { useEffect, useState } from 'preact/hooks';
import type { GameModule } from '../platform/rpg/types';
import { loadedGame, loadGame } from '../content/areas';
import { BackBar, Mentor, Screen } from './ui';

// Spelen laddas först när de behövs (se loadGame i content/areas.ts). Medan de laddas visas en blomma;
// om det misslyckas (ingen internet, eller en ny version har ersatt filerna) får barnet försöka igen.

export type Loaded<T> = T | 'laddar' | 'fel';

/** Väntar på `load()`. `ready` = redan laddat, då blir det ingen väntan alls. */
export function useLoaded<T extends object>(key: string, load: () => Promise<T>, ready?: T): Loaded<T> {
  const [got, setGot] = useState<{ key: string; v: T | 'fel' } | null>(null);
  useEffect(() => {
    if (ready) return;
    let live = true;
    load().then((v) => { if (live) setGot({ key, v }); }, () => { if (live) setGot({ key, v: 'fel' }); });
    return () => { live = false; };
  }, [key]);
  if (ready) return ready;
  return got?.key === key ? got.v : 'laddar';
}

export const useGame = (areaId: string): Loaded<GameModule> => useLoaded(areaId, () => loadGame(areaId), loadedGame(areaId));

/** Startar laddningen i förväg (t.ex. när barnet öppnar ett område), så att spelet är redo vid första frågan. */
export function preloadGame(areaId: string) {
  loadGame(areaId).catch(() => {});
}

export function Loading({ failed, back = 'karta' }: { failed: boolean; back?: string }) {
  if (!failed) return <div class="splash" aria-busy="true">🌸</div>;
  return (
    <Screen class="place">
      <BackBar label="Tillbaka" to={back} />
      <Mentor text="Hoppsan, jag kunde inte hämta spelet. Kolla att du har internet och försök igen.">
        <button class="btn primary" onClick={() => location.reload()}>Försök igen</button>
      </Mentor>
    </Screen>
  );
}
