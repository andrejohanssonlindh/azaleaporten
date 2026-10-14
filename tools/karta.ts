// Ritar om kartdatan till Kompassöns kartor. Körs en gång (och igen om vyerna ändras):
//   node tools/karta.ts
// Läser (ligger kvar lokalt, checkas aldrig in – se .gitignore):
//   src/games/geografi/kartdata/countries-50m.json          world-atlas@2 (Natural Earth 1:50m, public domain)
//   src/games/geografi/kartdata/svenska-landskap-klippt.geo.json   perliedman/svenska-landskap (CC0, Lantmäteriet)
// Skriver (checkas in, laddas med spelet):
//   src/games/geografi/kartdata/vy-<vy>.json   färdiga SVG-vägar per land (och landskap) i varje vy
//   src/games/geografi/kartdata/lander.json    varje land: engelskt namn, världsdel, mittpunkt, grannar
// Inga paket behövs.

import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { projektor, VYER, type Vy } from '../src/engines/karta/proj.ts';

type Pt = [number, number];
type Ring = Pt[];
type Poly = Ring[];

const DIR = new URL('../src/games/geografi/kartdata/', import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(f, DIR), 'utf8'));

/* ---------- TopoJSON → polygoner ---------- */

const topo = read('countries-50m.json');
const [sx, sy] = topo.transform.scale as [number, number];
const [tx, ty] = topo.transform.translate as [number, number];
const ARCS: Pt[][] = topo.arcs.map((a: number[][]) => {
  let x = 0, y = 0;
  return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty] as Pt; });
});
const arcPts = (i: number) => (i >= 0 ? ARCS[i] : ARCS[~i].slice().reverse());
const ringOf = (ids: number[]): Ring => {
  const out: Pt[] = [];
  ids.forEach((i, k) => { const p = arcPts(i); out.push(...(k ? p.slice(1) : p)); });
  return out;
};

interface Land { key: string; en: string; polys: Poly[]; arcs: Set<number> }

const LANDER: Land[] = [];
const sizeOf = (polys: Poly[]) => polys.reduce((s, p) => s + Math.abs(area(p[0])), 0);
for (const g of topo.objects.countries.geometries) {
  if (!g.type || !g.arcs) continue;
  const en: string = g.properties?.name ?? '?';
  const key = g.id != null ? String(g.id).padStart(3, '0') : `n:${en}`;
  const raw: number[][][] = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  const arcs = new Set<number>();
  for (const poly of raw) for (const r of poly) for (const i of r) arcs.add(i < 0 ? ~i : i);
  const polys = raw.map((poly) => poly.map(ringOf));
  // Samma nummer två gånger (Australien och Ashmoreöarna är båda 036): slå ihop, och behåll namnet på den största.
  const old = LANDER.find((l) => l.key === key);
  if (old) {
    if (sizeOf(polys) > sizeOf(old.polys)) old.en = en;
    old.polys.push(...polys);
    for (const a of arcs) old.arcs.add(a);
    continue;
  }
  LANDER.push({ key, en, polys, arcs });
}

/* ---------- geometri ---------- */

function area(r: Ring) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; }

function inside(r: Ring, x: number, y: number) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function segDist(px: number, py: number, [ax, ay]: Pt, [bx, by]: Pt) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

const edgeDist = (r: Ring, x: number, y: number) => { let d = Infinity; for (let i = 0, j = r.length - 1; i < r.length; j = i++) d = Math.min(d, segDist(x, y, r[j], r[i])); return d; };

/** Punkten längst in i ringen (ungefär): där får namnet och träffytan plats. Returnerar [x, y, avstånd till kanten]. */
function label(r: Ring): [number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  let best: [number, number, number] = [(x0 + x1) / 2, (y0 + y1) / 2, -1];
  let step = Math.max(x1 - x0, y1 - y0) / 24;
  let cx0 = x0, cy0 = y0, cx1 = x1, cy1 = y1;
  for (let round = 0; round < 4; round++) {
    for (let x = cx0; x <= cx1; x += step) for (let y = cy0; y <= cy1; y += step) {
      if (!inside(r, x, y)) continue;
      const d = edgeDist(r, x, y);
      if (d > best[2]) best = [x, y, d];
    }
    cx0 = best[0] - step; cx1 = best[0] + step; cy0 = best[1] - step; cy1 = best[1] + step;
    step /= 5;
  }
  if (best[2] < 0) { const [x, y] = r[0]; best = [x, y, 0]; }
  return best;
}

/** Douglas–Peucker på en sluten ring. */
function simplify(r: Ring, tol: number): Ring {
  if (r.length < 5) return r;
  let far = 1, fd = -1;
  for (let i = 1; i < r.length; i++) { const d = Math.hypot(r[i][0] - r[0][0], r[i][1] - r[0][1]); if (d > fd) { fd = d; far = i; } }
  const half = (pts: Pt[]) => {
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack: [number, number][] = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop()!;
      let m = -1, md = tol;
      for (let i = a + 1; i < b; i++) { const d = segDist(pts[i][0], pts[i][1], pts[a], pts[b]); if (d > md) { md = d; m = i; } }
      if (m >= 0) { keep[m] = 1; stack.push([a, m], [m, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  };
  const a = half(r.slice(0, far + 1)), b = half([...r.slice(far), r[0]]);
  return [...a, ...b.slice(1, -1)];
}

/** Klipper en ring mot en rektangel (Sutherland–Hodgman). */
function clipRect(r: Ring, x0: number, y0: number, x1: number, y1: number): Ring {
  const edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  let out = r;
  for (const [ins, cut] of edges) {
    if (!out.length) break;
    const src = out; out = [];
    for (let i = 0; i < src.length; i++) {
      const cur = src[i], prev = src[(i + src.length - 1) % src.length];
      if (ins(cur)) { if (!ins(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (ins(prev)) out.push(cut(prev, cur));
    }
  }
  return out;
}

/** Klipper en ring i longitud (för att dela Ryssland vid Ural). keepWest = behåll det som ligger väster om lon. */
function clipLon(r: Ring, lon: number, keepWest: boolean): Ring {
  const ins = (p: Pt) => (keepWest ? p[0] <= lon : p[0] >= lon);
  const cut = (a: Pt, b: Pt): Pt => [lon, a[1] + ((b[1] - a[1]) * (lon - a[0])) / (b[0] - a[0])];
  const out: Ring = [];
  for (let i = 0; i < r.length; i++) {
    const cur = r[i], prev = r[(i + r.length - 1) % r.length];
    if (ins(cur)) { if (!ins(prev)) out.push(cut(prev, cur)); out.push(cur); }
    else if (ins(prev)) out.push(cut(prev, cur));
  }
  return out;
}

/* ---------- SVG-vägar ---------- */

const r1 = (n: number) => Math.round(n * 10) / 10;
const num = (n: number) => { const s = String(r1(n)); return s.replace(/^0\./, '.').replace(/^-0\./, '-.'); };
const sep = (s: string) => (s.startsWith('-') ? s : ` ${s}`);

function pathOf(rings: Ring[]): string {
  let d = '';
  for (const r of rings) {
    const pts = r.map(([x, y]) => [r1(x), r1(y)] as Pt);
    d += `M${num(pts[0][0])}${sep(num(pts[0][1]))}l`;
    let first = true;
    for (let i = 1; i < pts.length; i++) {
      const dx = r1(pts[i][0] - pts[i - 1][0]), dy = r1(pts[i][1] - pts[i - 1][1]);
      if (!dx && !dy) continue;
      const a = num(dx), b = num(dy);
      d += (first ? a : sep(a)) + sep(b);
      first = false;
    }
    d += 'z';
  }
  return d;
}

/* ---------- världsdelar ---------- */

// Undantag från reglerna nedan, efter ISO-nummer.
const DEL_UNDANTAG: Record<string, string> = {
  '232': 'afrika', // Eritrea (ligger nordost om reglernas gräns)
  '196': 'europa', 'n:N. Cyprus': 'europa', // Cypern
  '470': 'europa', // Malta
  '792': 'asien', // Turkiet (räknas till Asien på kartan; frågas aldrig med ett enda svar)
  '010': 'antarktis',
};

/** Världsdel efter landets mittpunkt (lon, lat). Ryssland delas för sig. */
function delOf(key: string, lon: number, lat: number): string {
  if (DEL_UNDANTAG[key]) return DEL_UNDANTAG[key];
  if (lat < -60) return 'antarktis';
  // Öarna i Stilla havet (Samoa, Tonga, Guam, Palau …) hör till Oceanien.
  if ((lon < -120 && lat < 25) || (lon >= 130 && lat < 20 && lat > -60)) return 'oceanien';
  if (lon < -25) return (lat > 7.2 && lon < -77) || lat > 12.5 ? 'nordamerika' : 'sydamerika';
  if ((lon > 110 && lat < -10) || (lon > 140 && lat < 0) || lon < -150) return 'oceanien';
  if (lat < 37.5 && lon >= -25 && lon <= 58 && !(lon > 34.5 && lat > 12.5)) return 'afrika';
  if (lon < 41 && lat > 36) return 'europa';
  return 'asien';
}

/* ---------- länderna i grader: mittpunkt, världsdel, grannar ---------- */

const RUSSIA = '643';
const URAL = 60;

const geoArea = (r: Ring) => { const c = Math.cos((r.reduce((s, p) => s + p[1], 0) / r.length) * Math.PI / 180); return Math.abs(area(r)) * c; };

/** Mittpunkt i grader: punkten längst in i landets största ö, räknad med krympta längdgrader. */
function geoLabel(l: Land): [number, number] {
  const outer = l.polys.map((p) => p[0]).sort((a, b) => geoArea(b) - geoArea(a))[0];
  const c = Math.cos((outer.reduce((s, p) => s + p[1], 0) / outer.length) * Math.PI / 180);
  const [x, y] = label(outer.map(([lo, la]) => [lo * c, la] as Pt));
  return [x / c, y];
}

const byArc = new Map<number, string[]>();
for (const l of LANDER) for (const a of l.arcs) byArc.set(a, [...(byArc.get(a) ?? []), l.key]);

const META: Record<string, { en: string; del: string; lon: number; lat: number; grannar: string[] }> = {};
for (const l of LANDER) {
  const [lon, lat] = geoLabel(l);
  const g = new Set<string>();
  for (const a of l.arcs) for (const k of byArc.get(a) ?? []) if (k !== l.key) g.add(k);
  META[l.key] = { en: l.en, del: l.key === RUSSIA ? 'europa+asien' : delOf(l.key, lon, lat), lon: r1(lon * 10) / 10, lat: r1(lat * 10) / 10, grannar: [...g].sort() };
}

/* ---------- vyerna ---------- */

interface Ut { d: string; x: number; y: number; r: number; a: number; del?: string }

/** Ett lands (eller landskaps) polygoner i en vy: projicerade, klippta, förenklade. Null om inget syns. */
function inVy(polys: Poly[], v: Vy, pr: ReturnType<typeof projektor>): Ut | null {
  const m = 3, rings: Ring[] = [];
  let outerArea = 0, bestA = 0;
  let bestRing: Ring = [];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const ring = poly[i];
      // Snabbt bort med det som ligger helt utanför vyn.
      if (v.proj === 'eq' && (ring.every(([lo]) => lo < v.lon0 - 2) || ring.every(([lo]) => lo > v.lon1 + 2))) continue;
      if (ring.every(([, la]) => la < v.lat0 - 2) || ring.every(([, la]) => la > v.lat1 + 2)) continue;
      const p = clipRect(ring.map(([lo, la]) => pr.p(lo, la)), -m, -m, pr.w + m, pr.h + m);
      if (p.length < 3) continue;
      const s = simplify(p, v.tol);
      const a = Math.abs(area(s));
      if (s.length < 3 || a < 1.2) continue;
      rings.push(s);
      if (i === 0) { outerArea += a; if (a > bestA) { bestA = a; bestRing = s; } }
    }
  }
  if (!rings.length || !bestRing.length) return null;
  const [x, y, r] = label(bestRing);
  return { d: pathOf(rings), x: r1(x), y: r1(y), r: r1(r), a: Math.round(outerArea) };
}

/** Små länder som försvann i förenklingen får ändå en punkt (Malta, Monaco …), om de ligger i vyn. */
function punktIVy(l: Land, pr: ReturnType<typeof projektor>): Ut | null {
  const [x, y] = pr.p(META[l.key].lon, META[l.key].lat);
  if (x < 0 || y < 0 || x > pr.w || y > pr.h) return null;
  return { d: '', x: r1(x), y: r1(y), r: 0, a: 0 };
}

const sizes: string[] = [];
function write(name: string, data: unknown) {
  const s = JSON.stringify(data);
  writeFileSync(new URL(name, DIR), s);
  sizes.push(`${name.padEnd(22)} ${(s.length / 1024).toFixed(0).padStart(5)} KB   gzip ${(gzipSync(s).length / 1024).toFixed(0).padStart(4)} KB`);
}

const landskap = read('svenska-landskap-klippt.geo.json');

for (const v of VYER) {
  const pr = projektor(v);
  const lander: Record<string, Ut> = {};
  for (const l of LANDER) {
    if (l.key === RUSSIA && v.id === 'varld') {
      // Ryssland delas vid Ural, så att Europa och Asien går att trycka på var för sig.
      for (const [suffix, west, del] of [['-eu', true, 'europa'], ['-as', false, 'asien']] as const) {
        const polys = l.polys.map((p) => p.map((r) => clipLon(r, URAL, west)).filter((r) => r.length >= 3)).filter((p) => p.length);
        const u = inVy(polys, v, pr);
        if (u) lander[RUSSIA + suffix] = { ...u, del };
      }
      continue;
    }
    const u = inVy(l.polys, v, pr) ?? punktIVy(l, pr);
    if (!u) continue;
    if (v.id === 'varld') u.del = META[l.key].del;
    lander[l.key] = u;
  }
  const out: Record<string, unknown> = { id: v.id, w: pr.w, h: pr.h, lander };
  if (v.id === 'sverige') {
    const ls: Record<string, Ut & { landsdel: string }> = {};
    for (const f of landskap.features) {
      const g = f.geometry;
      const polys: Poly[] = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      const u = inVy(polys, v, pr);
      if (u) ls[f.properties.landskap] = { ...u, landsdel: f.properties.landsdel };
    }
    out.landskap = ls;
  }
  write(`vy-${v.id}.json`, out);
}

write('lander.json', META);
console.log(sizes.join('\n'));
console.log(`${LANDER.length} länder. Klart!`);
