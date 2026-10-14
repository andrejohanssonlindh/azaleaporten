import { allNodes, type AreaDef, type GameModule } from '../platform/rpg/types';
import { getArea } from '../platform/rpg/progress';
import { REGIONS } from './world';
import { regionGame } from '../games/region';
import { TALBERGEN_TOPPEN } from '../games/talbergen';
import { TIDSTORNET } from '../games/klocka/content';
import { TIOKOMPISBRON } from '../games/tiokompis/content';
import { TABELLGRUVAN } from '../games/tabeller/content';
import { MYNTMARKNADEN } from '../games/pengar/content';
import { TALLINJEBRON } from '../games/tallinje/content';
import { BRAKBAGERIET } from '../games/brak/content';
import { BETONGBUKTENS_TOPP } from '../games/geometri/betongbukten';
import { FLUFFY } from '../games/geometri/former/content';
import { SVAMPEN } from '../games/geometri/symmetri/content';
import { OXIE } from '../games/geometri/langd/content';
import { SIBBARP } from '../games/geometri/vinklar/content';
import { BRYGGERIET } from '../games/geometri/area/content';
import { KROKSBACK } from '../games/geometri/kroppar/content';
import { STAPELBADDSPARKEN } from '../games/geometri/cirklar/content';
import { STAVNINGSTRASKET } from '../games/stavning/content';
import { RIMBACKEN } from '../games/rim/content';
import { MENINGSSMEDJAN } from '../games/mening/content';
import { ORDKLASSERNAS_TEMPEL } from '../games/ordklass/content';
import { BERATTELSEBIBLIOTEKET } from '../games/berattelse/content';
import { ORDSKOGENS_HJARTA } from '../games/ordskogen';
import { GLOSVIKEN } from '../games/glosor/content';
import { HAMNEN } from '../games/hamnen/content';
import { BIG_BEN_TORNET } from '../games/bigben/content';
import { STAVKLIPPAN } from '../games/stavklippan/content';
import { PIRATSKEPPET } from '../games/pirat/content';
import { VASTERONS_FYR } from '../games/vasteron';
import { LOGIKSLINGAN } from '../games/logik/content';
import { BUGGJAKTEN, KODSTIGEN, LOOPVERKSTADEN } from '../games/robot/content';
import { PYTHONHAMNEN } from '../games/python/content';
import { ROBOTFABRIKEN } from '../games/roboton';
import { FAGELTORNET, SKORDEMARKNADEN } from '../games/diagram/content';
import { BALLONGRESAN, FLAGGMASTEN, GLOBEN, HUVUDSTADSEXPRESSEN, KARTRUMMET, SVERIGERESAN } from '../games/geografi/content';
import { OBSERVATORIET } from '../games/kompasson';

// Spelbara områden: områdets innehåll (litet, laddas direkt) + spelet som levererar frågorna.
// Spelkoden laddas först när någon spelar i området, så att startsidan förblir liten.
export interface Playable { def: AreaDef; load: () => Promise<GameModule> }

const AREAS: Record<string, Playable> = {
  tidstornet: { def: TIDSTORNET, load: () => import('../games/klocka').then((m) => m.klocka) },
  tiokompisbron: { def: TIOKOMPISBRON, load: () => import('../games/tiokompis').then((m) => m.tiokompis) },
  tabellgruvan: { def: TABELLGRUVAN, load: () => import('../games/tabeller').then((m) => m.tabeller) },
  myntmarknaden: { def: MYNTMARKNADEN, load: () => import('../games/pengar').then((m) => m.pengar) },
  tallinjebron: { def: TALLINJEBRON, load: () => import('../games/tallinje').then((m) => m.tallinje) },
  brakbageriet: { def: BRAKBAGERIET, load: () => import('../games/brak').then((m) => m.brak) },
  fluffy: { def: FLUFFY, load: () => import('../games/geometri/former').then((m) => m.former) },
  svampen: { def: SVAMPEN, load: () => import('../games/geometri/symmetri').then((m) => m.symmetri) },
  oxie: { def: OXIE, load: () => import('../games/geometri/langd').then((m) => m.langd) },
  sibbarp: { def: SIBBARP, load: () => import('../games/geometri/vinklar').then((m) => m.vinklar) },
  bryggeriet: { def: BRYGGERIET, load: () => import('../games/geometri/area').then((m) => m.area) },
  kroksback: { def: KROKSBACK, load: () => import('../games/geometri/kroppar').then((m) => m.kroppar) },
  stapelbaddsparken: { def: STAPELBADDSPARKEN, load: () => import('../games/geometri/cirklar').then((m) => m.cirklar) },
  stavningstrasket: { def: STAVNINGSTRASKET, load: () => import('../games/stavning').then((m) => m.stavning) },
  rimbacken: { def: RIMBACKEN, load: () => import('../games/rim').then((m) => m.rim) },
  meningssmedjan: { def: MENINGSSMEDJAN, load: () => import('../games/mening').then((m) => m.mening) },
  'ordklassernas-tempel': { def: ORDKLASSERNAS_TEMPEL, load: () => import('../games/ordklass').then((m) => m.ordklass) },
  berattelsebiblioteket: { def: BERATTELSEBIBLIOTEKET, load: () => import('../games/berattelse').then((m) => m.berattelse) },
  glosviken: { def: GLOSVIKEN, load: () => import('../games/glosor').then((m) => m.glosor) },
  hamnen: { def: HAMNEN, load: () => import('../games/hamnen').then((m) => m.hamnen) },
  'big-ben-tornet': { def: BIG_BEN_TORNET, load: () => import('../games/bigben').then((m) => m.bigben) },
  stavklippan: { def: STAVKLIPPAN, load: () => import('../games/stavklippan').then((m) => m.stavklippan) },
  piratskeppet: { def: PIRATSKEPPET, load: () => import('../games/pirat').then((m) => m.pirat) },
  logikslingan: { def: LOGIKSLINGAN, load: () => import('../games/logik').then((m) => m.logik) },
  kodstigen: { def: KODSTIGEN, load: () => import('../games/robot').then((m) => m.kodstigen) },
  loopverkstaden: { def: LOOPVERKSTADEN, load: () => import('../games/robot').then((m) => m.loopverkstaden) },
  buggjakten: { def: BUGGJAKTEN, load: () => import('../games/robot').then((m) => m.buggjakten) },
  pythonhamnen: { def: PYTHONHAMNEN, load: () => import('../games/python').then((m) => m.python) },
  fageltornet: { def: FAGELTORNET, load: () => import('../games/diagram').then((m) => m.fageltornet) },
  skordemarknaden: { def: SKORDEMARKNADEN, load: () => import('../games/diagram').then((m) => m.skordemarknaden) },
  kartrummet: { def: KARTRUMMET, load: () => import('../games/geografi').then((m) => m.kartrummet) },
  globen: { def: GLOBEN, load: () => import('../games/geografi').then((m) => m.globen) },
  sverigeresan: { def: SVERIGERESAN, load: () => import('../games/geografi').then((m) => m.sverigeresan) },
  ballongresan: { def: BALLONGRESAN, load: () => import('../games/geografi').then((m) => m.ballongresan) },
  huvudstadsexpressen: { def: HUVUDSTADSEXPRESSEN, load: () => import('../games/geografi').then((m) => m.huvudstadsexpressen) },
  flaggmasten: { def: FLAGGMASTEN, load: () => import('../games/geografi').then((m) => m.flaggmasten) },
};

// Regionbossar: en blandning av regionens spel.
async function gamesOf(region: string): Promise<Record<string, GameModule>> {
  const ids = REGIONS.find((r) => r.id === region)!.areas.map((a) => a.id).filter((id) => AREAS[id]);
  return Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await loadGame(id)] as const)));
}

export const PLAYABLE: Record<string, Playable> = {
  ...AREAS,
  talbergen: { def: TALBERGEN_TOPPEN, load: async () => regionGame('talbergen', await gamesOf('talbergen')) },
  betongbukten: { def: BETONGBUKTENS_TOPP, load: async () => regionGame('betongbukten', await gamesOf('betongbukten')) },
  ordskogen: { def: ORDSKOGENS_HJARTA, load: async () => regionGame('ordskogen', await gamesOf('ordskogen')) },
  vasteron: { def: VASTERONS_FYR, load: async () => regionGame('vasteron', await gamesOf('vasteron')) },
  roboton: { def: ROBOTFABRIKEN, load: async () => regionGame('roboton', await gamesOf('roboton')) },
  kompasson: { def: OBSERVATORIET, load: async () => regionGame('kompasson', await gamesOf('kompasson')) },
};

const loading = new Map<string, Promise<GameModule>>();
const loaded = new Map<string, GameModule>();

/** Laddar områdets spel (en gång). Ett misslyckat försök glöms, så att det går att försöka igen. */
export function loadGame(areaId: string): Promise<GameModule> {
  let p = loading.get(areaId);
  if (!p) {
    if (!PLAYABLE[areaId]) return Promise.reject(new Error(`Okänt område: ${areaId}`));
    p = PLAYABLE[areaId].load().then((g) => { loaded.set(areaId, g); return g; });
    p.catch(() => loading.delete(areaId));
    loading.set(areaId, p);
  }
  return p;
}

/** Spelet om det redan är laddat, annars undefined. */
export const loadedGame = (areaId: string): GameModule | undefined => loaded.get(areaId);

/** Alla spel (för tester). */
export async function loadAllGames(): Promise<Record<string, GameModule>> {
  const ids = Object.keys(PLAYABLE);
  return Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await loadGame(id)] as const)));
}

export const playable = (areaId: string) => PLAYABLE[areaId];

/** Hur många av regionens Mästare hjälten har besegrat, och hur många som krävs för regionbossen. */
export function regionProgress(hid: string, def: AreaDef): { have: number; need: number; open: boolean } {
  if (!def.region) return { have: 0, need: 0, open: true };
  const areas = REGIONS.find((r) => r.id === def.region!.id)?.areas ?? [];
  const have = areas.filter((a) => {
    const pl = AREAS[a.id];
    const m = pl && allNodes(pl.def).find((n) => n.type === 'boss' && n.kind === 'mastare');
    return m && getArea(hid, a.id).bosses[m.id]?.defeated;
  }).length;
  return { have, need: def.region.mastareNeeded, open: have >= def.region.mastareNeeded };
}
