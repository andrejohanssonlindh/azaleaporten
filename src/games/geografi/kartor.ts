import { bearing, projektor, vyById } from '../../engines/karta/proj';
import type { Karta, Prick, Yta } from '../../engines/karta/types';
import { DELAR, HAV, LAND, LAND_BY_ID, LAND_BY_ISO, type Del } from './land';
import vVarld from './kartdata/vy-varld.json';
import vEuropa from './kartdata/vy-europa.json';
import vNorden from './kartdata/vy-norden.json';
import vVast from './kartdata/vy-vast.json';
import vSyd from './kartdata/vy-syd.json';
import vOst from './kartdata/vy-ost.json';
import vAfrika from './kartdata/vy-afrika.json';
import vAsien from './kartdata/vy-asien.json';
import vNordamerika from './kartdata/vy-nordamerika.json';
import vSydamerika from './kartdata/vy-sydamerika.json';
import vOceanien from './kartdata/vy-oceanien.json';
import vSverige from './kartdata/vy-sverige.json';
import metaRaw from './kartdata/lander.json';

// Kartorna: vyerna som tools/karta.ts ritade ur Natural Earth (länderna som färdiga SVG-vägar), plus det
// spelet lägger till självt (haven, städer, sjöar). Allt här laddas bara med Kompassöns spel.

export interface VyLand { d: string; x: number; y: number; r: number; a: number; del?: string }
export interface VyData { id: string; w: number; h: number; lander: Record<string, VyLand>; landskap?: Record<string, VyLand & { landsdel: string }> }
export interface Meta { en: string; del: string; lon: number; lat: number; grannar: string[] }

export const VY: Record<string, VyData> = {
  varld: vVarld, europa: vEuropa, norden: vNorden, vast: vVast, syd: vSyd, ost: vOst, afrika: vAfrika, asien: vAsien,
  nordamerika: vNordamerika, sydamerika: vSydamerika, oceanien: vOceanien, sverige: vSverige,
} as unknown as Record<string, VyData>;

export const META = metaRaw as unknown as Record<string, Meta>;

/** Landets världsdel (undefined för länder i två världsdelar). */
export function delAv(id: string): Del | undefined {
  const l = LAND_BY_ID[id];
  if (!l || l.tvaDelar) return undefined;
  return META[l.iso]?.del as Del | undefined;
}

/** Grannarna bland Kompassöns länder (från gemensamma gränser i kartdatan). */
export const grannar = (id: string): string[] =>
  (META[LAND_BY_ID[id]?.iso]?.grannar ?? []).map((iso) => LAND_BY_ISO[iso]?.id).filter((x): x is string => !!x);

/** Väderstreck från ett land till ett annat (grader medurs från norr), mellan ländernas mittpunkter. */
export function riktning(fran: string, till: string): number {
  const a = META[LAND_BY_ID[fran].iso], b = META[LAND_BY_ID[till].iso];
  return bearing(a.lon, a.lat, b.lon, b.lat);
}

/* ---------- länder i en vy ---------- */

/** Länderna (id) som går att fråga om i en vy: de som syns där och hör till gruppen. */
export const GRUPPER: Record<string, { vy: string; lander: string[] }> = {
  norden: { vy: 'norden', lander: ['sverige', 'norge', 'danmark', 'finland', 'island'] },
  vast: { vy: 'vast', lander: ['storbritannien', 'irland', 'frankrike', 'belgien', 'nederlanderna', 'luxemburg', 'tyskland', 'schweiz', 'osterrike', 'danmark', 'spanien', 'portugal', 'italien', 'monaco'] },
  syd: { vy: 'syd', lander: ['spanien', 'portugal', 'italien', 'malta', 'grekland', 'kroatien', 'slovenien', 'bosnien', 'serbien', 'montenegro', 'albanien', 'nordmakedonien', 'bulgarien', 'rumanien', 'ungern', 'turkiet', 'frankrike', 'schweiz', 'osterrike'] },
  ost: { vy: 'ost', lander: ['polen', 'tjeckien', 'slovakien', 'ungern', 'rumanien', 'moldavien', 'ukraina', 'belarus', 'ryssland', 'estland', 'lettland', 'litauen', 'tyskland', 'osterrike', 'bulgarien', 'finland', 'sverige'] },
  europa: { vy: 'europa', lander: LAND.filter((l) => (META[l.iso]?.del === 'europa' || l.id === 'ryssland') && !l.liten && !['slovenien', 'montenegro', 'albanien', 'nordmakedonien', 'bosnien', 'moldavien'].includes(l.id)).map((l) => l.id) },
  afrika: { vy: 'afrika', lander: LAND.filter((l) => META[l.iso]?.del === 'afrika').map((l) => l.id) },
  asien: { vy: 'asien', lander: LAND.filter((l) => META[l.iso]?.del === 'asien' || l.id === 'ryssland').map((l) => l.id) },
  nordamerika: { vy: 'nordamerika', lander: LAND.filter((l) => META[l.iso]?.del === 'nordamerika').map((l) => l.id) },
  sydamerika: { vy: 'sydamerika', lander: LAND.filter((l) => META[l.iso]?.del === 'sydamerika').map((l) => l.id) },
  oceanien: { vy: 'oceanien', lander: LAND.filter((l) => META[l.iso]?.del === 'oceanien').map((l) => l.id) },
};

/** Syns landet i vyn (med en mittpunkt innanför kanten)? */
export function synsI(vy: string, id: string): boolean {
  const v = VY[vy], u = v?.lander[LAND_BY_ID[id]?.iso];
  return !!u && u.x > 2 && u.y > 2 && u.x < v.w - 2 && u.y < v.h - 2;
}

/** Gruppens länder som verkligen syns i vyn. */
export const iGrupp = (grupp: string) => GRUPPER[grupp].lander.filter((id) => synsI(GRUPPER[grupp].vy, id));

/** Litet land i vyn: får en ring att trycka på i stället för (eller utöver) sin form. */
const litenI = (u: VyLand, id: string) => !u.d || u.a < 30 || !!LAND_BY_ID[id]?.liten;

const TITEL: Record<string, string> = {
  varld: 'Världskarta', europa: 'Karta över Europa', norden: 'Karta över Norden', vast: 'Karta över Västeuropa', syd: 'Karta över Sydeuropa',
  ost: 'Karta över Östeuropa', afrika: 'Karta över Afrika', asien: 'Karta över Asien', nordamerika: 'Karta över Nordamerika',
  sydamerika: 'Karta över Sydamerika', oceanien: 'Karta över Australien och Oceanien', sverige: 'Karta över Sverige',
};

/** Träffytor för prickar: så stora som möjligt utan att nå grannens. */
function hitRadier(pr: Prick[], max = 14) {
  for (const p of pr) {
    let near = Infinity;
    for (const q of pr) if (q !== p) near = Math.min(near, Math.hypot(p.x - q.x, p.y - q.y));
    p.hit = Math.max(6, Math.min(max, near / 2));
  }
}

/**
 * En karta med länder. tap = länderna som går att trycka på (resten ritas som bakgrund).
 * lyser = länder som är markerade (små länder får en ring).
 */
export function landKarta(vy: string, tap: string[], lyser: string[] = []): Karta {
  const v = VY[vy];
  const tapSet = new Set(tap);
  const ytor: Yta[] = [];
  const prickar: Prick[] = [];
  for (const [iso, u] of Object.entries(v.lander)) {
    const l = LAND_BY_ISO[iso];
    const id = l?.id ?? `x${iso}`;
    const kan = tapSet.has(id);
    const liten = litenI(u, id);
    if (u.d) ytor.push({ id, d: u.d, typ: kan ? 'land' : 'bakland', tap: kan && !liten, namn: l?.namn, lx: u.x, ly: u.y });
    if ((kan || lyser.includes(id)) && liten) prickar.push({ id, x: u.x, y: u.y, namn: l?.namn, tap: kan });
  }
  hitRadier(prickar);
  return { w: v.w, h: v.h, hav: true, ytor, prickar, titel: TITEL[vy] };
}

/* ---------- världskartan: världsdelar och hav ---------- */

/** Haven, ritade under länderna (gränserna mellan dem går genom land, så de syns inte). Longitud, latitud. */
const HAV_POLY: Record<string, [number, number][]> = {
  norra: [[-180, 84], [180, 84], [180, 66], [-180, 66]],
  sodra: [[-180, -60], [180, -60], [180, -78], [-180, -78]],
  atlanten: [[-100, 66], [40, 66], [40, 30], [20, 30], [20, -60], [-67, -60], [-71, -50], [-69, -30], [-72, -10], [-75, 6], [-80, 9], [-84, 11], [-90, 15], [-95, 17], [-100, 22]],
  indiska: [[20, 30], [40, 30], [100, 20], [100, 8], [104, 1], [105, -6], [120, -8], [130, -8], [142, -11], [140, -25], [147, -40], [147, -60], [20, -60]],
  'stilla-o': [[-180, 66], [-100, 66], [-100, 22], [-95, 17], [-90, 15], [-84, 11], [-80, 9], [-75, 6], [-72, -10], [-69, -30], [-71, -50], [-67, -60], [-180, -60]],
  'stilla-v': [[100, 66], [180, 66], [180, -60], [147, -60], [147, -40], [140, -25], [142, -11], [130, -8], [120, -8], [105, -6], [104, 1], [100, 8], [100, 20]],
};
const HAV_NAMN_AT: Record<string, [number, number]> = { stilla: [-140, 5], atlanten: [-38, 22], indiska: [78, -22], norra: [0, 77], sodra: [10, -64] };
const DEL_NAMN_AT: Record<Del, [number, number]> = {
  europa: [16, 52], asien: [92, 46], afrika: [20, 6], nordamerika: [-102, 46], sydamerika: [-60, -14], oceanien: [134, -25], antarktis: [0, -74],
};

/** En polygon i grader → SVG-väg, med tätare punkter så att kanterna följer projektionen. */
function polyPath(pts: [number, number][], p: (lon: number, lat: number) => [number, number]) {
  const out: string[] = [];
  pts.forEach(([lo, la], i) => {
    const [lo2, la2] = pts[(i + 1) % pts.length];
    for (let k = 0; k < 12; k++) {
      const [x, y] = p(lo + ((lo2 - lo) * k) / 12, la + ((la2 - la) * k) / 12);
      out.push(`${out.length ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  });
  return `${out.join('')}Z`;
}

/** Var ett land ligger på världskartan (Ryssland: den europeiska delen). */
export function iVarlden(id: string): [number, number] | null {
  const iso = LAND_BY_ID[id]?.iso;
  const u = VY.varld.lander[iso] ?? VY.varld.lander[`${iso}-eu`];
  return u ? [u.x, u.y] : null;
}

/**
 * Världskartan. delar = världsdelarna går att trycka på; hav = haven går att trycka på (och syns med namn när klara).
 * prick = ett land som markeras med en prick. ekvator = rita ekvatorn.
 */
export function varldKarta(o: { delar?: boolean; hav?: boolean; prick?: string; ekvator?: boolean } = {}): Karta {
  const v = VY.varld, pr = projektor(vyById('varld'));
  const ytor: Yta[] = [];
  if (o.hav) {
    for (const h of HAV) {
      const d = h.id === 'stilla' ? polyPath(HAV_POLY['stilla-o'], pr.p) + polyPath(HAV_POLY['stilla-v'], pr.p) : polyPath(HAV_POLY[h.id], pr.p);
      const [lx, ly] = pr.p(...HAV_NAMN_AT[h.id]);
      ytor.push({ id: h.id, d, typ: 'hav', tap: true, namn: h.namn, lx, ly });
    }
  }
  const per: Record<string, string[]> = {};
  for (const u of Object.values(v.lander)) if (u.d && u.del) (per[u.del] ??= []).push(u.d);
  for (const d of DELAR) {
    const [lx, ly] = pr.p(...DEL_NAMN_AT[d.id]);
    ytor.push({ id: d.id, d: (per[d.id] ?? []).join(''), typ: 'land', tap: !!o.delar, namn: d.namn, lx, ly });
  }
  const prickar: Prick[] = [];
  if (o.prick) {
    const at = iVarlden(o.prick);
    if (at) prickar.push({ id: o.prick, x: at[0], y: at[1], namn: LAND_BY_ID[o.prick]?.namn });
  }
  return { w: v.w, h: v.h, hav: true, ytor, prickar, ekvator: o.ekvator ? pr.p(0, 0)[1] : undefined, titel: TITEL.varld };
}
