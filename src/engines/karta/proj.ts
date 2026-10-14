// Kartvyerna och deras projektioner. Används både av tools/karta.ts (som ritar om Natural Earth-datan
// till färdiga SVG-vägar) och av spelet (som lägger egna saker på kartan: städer, sjöar, hav).
// Filen får inte importera något annat, så att node kan köra verktyget direkt.

export interface Vy {
  id: string;
  /** ee = Equal Earth (hela världen), eq = rak latitud/longitud med längdgraderna krympta efter mittlatituden. */
  proj: 'ee' | 'eq';
  lon0: number;
  lon1: number;
  lat0: number;
  lat1: number;
  /** Bredd i kartans enheter (viewBox). */
  w: number;
  /** Hur mycket kusterna förenklas (i kartans enheter). */
  tol: number;
}

export const VYER: Vy[] = [
  { id: 'varld', proj: 'ee', lon0: -180, lon1: 180, lat0: -78, lat1: 84, w: 400, tol: 0.5 },
  { id: 'europa', proj: 'eq', lon0: -25, lon1: 45, lat0: 34, lat1: 72, w: 400, tol: 0.5 },
  { id: 'norden', proj: 'eq', lon0: -25, lon1: 33, lat0: 54, lat1: 71.5, w: 400, tol: 0.45 },
  { id: 'vast', proj: 'eq', lon0: -11, lon1: 20, lat0: 38.5, lat1: 59.5, w: 400, tol: 0.45 },
  { id: 'syd', proj: 'eq', lon0: -10, lon1: 37, lat0: 34, lat1: 48.5, w: 400, tol: 0.45 },
  { id: 'ost', proj: 'eq', lon0: 12, lon1: 42, lat0: 41.5, lat1: 65, w: 400, tol: 0.45 },
  { id: 'afrika', proj: 'eq', lon0: -20, lon1: 55, lat0: -36, lat1: 38, w: 400, tol: 0.5 },
  { id: 'asien', proj: 'eq', lon0: 25, lon1: 150, lat0: -12, lat1: 56, w: 400, tol: 0.5 },
  { id: 'nordamerika', proj: 'eq', lon0: -170, lon1: -50, lat0: 5, lat1: 75, w: 400, tol: 0.5 },
  { id: 'sydamerika', proj: 'eq', lon0: -85, lon1: -33, lat0: -56, lat1: 14, w: 300, tol: 0.45 },
  { id: 'oceanien', proj: 'eq', lon0: 110, lon1: 180, lat0: -48, lat1: 0, w: 400, tol: 0.5 },
  { id: 'sverige', proj: 'eq', lon0: 10, lon1: 24.5, lat0: 55, lat1: 69.3, w: 240, tol: 0.35 },
];

export const vyById = (id: string): Vy => {
  const v = VYER.find((x) => x.id === id);
  if (!v) throw new Error(`Okänd kartvy: ${id}`);
  return v;
};

const RAD = Math.PI / 180;

/** Equal Earth (Šavrič, Patterson, Jenny 2018). Ger x i ±2,71 och y i ±1,32. */
export function equalEarth(lon: number, lat: number): [number, number] {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const l = lon * RAD, th = Math.asin(M * Math.sin(lat * RAD));
  const t2 = th * th, t6 = t2 * t2 * t2;
  const x = (l * Math.cos(th)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

export interface Projektor {
  w: number;
  h: number;
  /** Longitud, latitud → kartans x, y (y nedåt). */
  p(lon: number, lat: number): [number, number];
}

/** Projektionen för en vy: kartans bredd är vy.w, höjden följer av vyn. */
export function projektor(v: Vy): Projektor {
  if (v.proj === 'ee') {
    const [x0] = equalEarth(v.lon0, 0), [x1] = equalEarth(v.lon1, 0);
    const [, yTop] = equalEarth(0, v.lat1), [, yBot] = equalEarth(0, v.lat0);
    const k = v.w / (x1 - x0);
    return { w: v.w, h: Math.round((yTop - yBot) * k * 10) / 10, p: (lon, lat) => { const [x, y] = equalEarth(lon, lat); return [(x - x0) * k, (yTop - y) * k]; } };
  }
  const c = Math.cos(((v.lat0 + v.lat1) / 2) * RAD);
  const k = v.w / ((v.lon1 - v.lon0) * c);
  return { w: v.w, h: Math.round((v.lat1 - v.lat0) * k * 10) / 10, p: (lon, lat) => [(lon - v.lon0) * c * k, (v.lat1 - lat) * k] };
}

/** Väderstrecket från en punkt till en annan (grader medurs från norr), på en karta med krympta längdgrader. */
export function bearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dx = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * RAD), dy = lat2 - lat1;
  return (Math.atan2(dx, dy) / RAD + 360) % 360;
}
