import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import {
  BITAR, FARGNAMN, LOST, MOTSATT, PLATSER, arLost, bitMedFarger, dragBas, dragVarv, farger, hem, inv, invDrag, paPlats, sitter, vrid,
  type Bit, type Drag, type Farg, type Kub,
} from '../../engines/kub/kub';
import {
  ALG, STEG, delDrag, forstaLagret, gulFormFri, gulaHornPaPlats, gulaKanterSitter, gultKors, korsKanter, korsKlart, kronblad, los, tvaLager,
  type AlgId, type Del, type StegId,
} from '../../engines/kub/losning';

// Kublabbet: frågor om Rubiks kub. Ett läge (mode) + en nivå blir en fråga. Färdighets-id:n och felkoder är permanenta.
//
// Sorter: gor = gör dragen i ett kubprogram (bara första felet räknas); vilket = vilket drag gjordes?;
// bit = tryck på en bit på kuben; losa = vrid själv tills målet är nått; valj = välj steg eller kubprogram.

export type KubKind = 'gor' | 'vilket' | 'bit' | 'losa' | 'valj';
export interface Alt { label: string; err?: string }
export type Mal =
  | { typ: 'blomma'; n: number }
  | { typ: 'kors'; n: number }
  | { typ: 'horn' | 'mitten'; bit: Farg[] }
  | { typ: 'gulkors' | 'gulkant' | 'gulhorn' | 'lost' };

export interface KubQ {
  mode: string;
  level: number;
  skill: string;
  kind: KubKind;
  prompt: string;
  start: Kub;
  /** gor: programmet som ska göras; losa: programmet som blandade kuben (bara att titta på). */
  alg?: Drag[];
  /** Brickorna grupperas i så här långa bitar (samma knep flera gånger). */
  grupp?: number;
  /** gor: programmet är dolt (utantill) tills barnet gör fel. */
  dold?: boolean;
  /** vilket: draget som visas. */
  drag?: Drag;
  /** vilket och valj: alternativen. */
  alts?: Alt[];
  /** bit: klistermärken som är rätt, och felkoden för de andra. */
  ratt?: number[];
  fel?: Record<number, string>;
  /** Färgprickar i frågan. */
  fargprick?: Farg[];
  /** Klistermärken som lyser (biten frågan handlar om). */
  markera?: number[];
  /** losa: målet, en lösning och hur många drag barnet får göra innan det får börja om. */
  mal?: Mal;
  losning?: Drag[];
  maxDrag?: number;
  /** Knapparna för att vrida hela kuben. */
  rotera?: boolean;
  /** Visa också kuben underifrån. */
  underifran?: boolean;
  /** Visa gula sidan ovanifrån. */
  topp?: boolean;
  /** Hela kuben: visa vilket steg det är och tips om nästa drag. */
  hela?: boolean;
}

export const KUB_ERR: Record<string, string> = {
  prim: 'Vrider åt fel håll (prim)',
  'motsatt-sida': 'Blandar ihop motsatta sidor',
  'fel-sida': 'Vrider fel sida',
  dubbel: 'Gör inte ett halvt varv åt samma håll',
  mittbit: 'Blandar ihop mittbiten med de andra bitarna',
  'kant-horn': 'Blandar ihop kant och hörn',
  'fel-farger': 'Tittar inte på alla färgerna',
  'fel-plats': 'Hittar inte platsen där biten hör hemma',
  'fel-mitt': 'Sätter ner kronbladet vid fel mittbit',
  forstorde: 'Förstör det som redan var klart',
  'vand-fel': 'Sätter in biten fel vänd',
  'inte-klar': 'Slutar innan det är klart',
  'for-manga-drag': 'Vrider på måfå',
  framlanges: 'Gör programmet framlänges i stället för baklänges',
  ordning: 'Gör dragen i fel ordning',
  'fel-steg': 'Vet inte vilket steg som är nästa',
  'fel-knep': 'Väljer fel kubprogram',
};

export interface Forklaring { title: string; text: string }

/** Förklaringen efter ett fel. Den förklarar metoden och säger aldrig vilket drag som är rätt. */
export function explainKub(tag: string, q: KubQ): Forklaring {
  switch (tag) {
    case 'prim': return { title: 'Åt fel håll!', text: 'Ett drag utan tecken vrider sidan medurs – som klockans visare när du tittar rakt på den sidan. Med ′ (prim) vrids den åt andra hållet, moturs.' };
    case 'motsatt-sida': return { title: 'Sidan mittemot!', text: 'Du vred sidan på andra sidan kuben. R är höger och L är vänster. U är upp och D är ner. F är framsidan som tittar på dig, och B är baksidan.' };
    case 'fel-sida': return { title: 'Fel sida!', text: 'Titta på bokstaven igen: R = höger, L = vänster, U = upp, D = ner, F = fram och B = bak.' };
    case 'dubbel': return { title: 'Två gånger åt samma håll', text: 'En 2:a efter bokstaven betyder ett halvt varv. Vrid samma sida två gånger, åt samma håll båda gångerna.' };
    case 'mittbit': return { title: 'Mittbit, kant eller hörn?', text: 'Mittbiten sitter mitt på en sida och har bara en färg. Den flyttar sig aldrig! Kantbitar har två färger och hörnbitar har tre.' };
    case 'kant-horn': return { title: 'Kant eller hörn?', text: 'En kantbit har två färger och sitter mellan två hörn. En hörnbit har tre färger och sitter ute i ett hörn.' };
    case 'fel-farger': return { title: 'Titta på alla färgerna', text: 'Biten du letar efter har precis de färgerna – inga andra. Titta på alla sidor av biten, inte bara den som syns mest.' };
    case 'fel-plats': return { title: 'Inte där', text: 'En bit hör hemma mellan mittbitarna som har samma färger som biten. Mittbitarna flyttar sig aldrig, så de visar vägen!' };
    case 'fel-mitt': return { title: 'Kronbladet hamnade fel', text: 'Vrid den gula sidan (U) tills kronbladets andra färg står precis ovanför mittbiten med samma färg. Först då vrider du den sidan två gånger, så att det vita hamnar nere vid den vita mitten.' };
    case 'forstorde': return { title: 'Oj, något gick sönder', text: 'Det som redan var klart måste sitta kvar när du är färdig. Tryck Ångra eller Börja om. Knepen från lektionen tar alltid tillbaka det de flyttar.' };
    case 'vand-fel':
      return q.mal?.typ === 'horn'
        ? { title: 'Hörnet sitter fel vänt', text: 'Hörnet är på rätt plats men vänt åt fel håll. Fortsätt med höger-tricket! Ett hörn kan behöva tricket en, tre eller fem gånger.' }
        : { title: 'Kanten sitter fel vänd', text: 'Kanten kom in men är vänd åt fel håll. Då valde du nog fel håll. Ta ut den med kubprogrammet igen. Titta sedan på färgen som pekar uppåt: den visar om kanten ska åt höger eller åt vänster.' };
    case 'inte-klar': return { title: 'Inte klart än', text: 'Fortsätt vrida! Tänk på vilken bit som ska vart. Tryck Ångra om du vill backa ett drag.' };
    case 'for-manga-drag': return { title: 'Det blev många drag', text: 'Kuben är tillbaka som den var. Tänk först: vilken bit ska vart? Använd knepet från lektionen, steg för steg.' };
    case 'framlanges': return { title: 'Framlänges igen', text: 'För att ta tillbaka ett program gör du det baklänges: det sista draget först, och varje drag åt andra hållet (′).' };
    case 'ordning': return { title: 'Fel ordning', text: 'Du vände dragen åt rätt håll, men ordningen blev fel. Börja med det sista draget och gå bakåt!' };
    case 'fel-steg': return { title: 'Inte det steget', text: 'Gå igenom stegen i ordning: blomman, vita korset, vita hörnen, mittenlagret, gula korset, gula kanterna, gula hörnen och sist vrida hörnen. Vilket är det första som inte är klart? Titta också underifrån!' };
    case 'fel-knep': return { title: 'Inte det kubprogrammet', text: 'Titta på gula sidan: Finns det ett gult kors? Sitter kanterna rätt mot mittbitarna? Är hörnen på rätt plats? Det första som inte är klart avgör.' };
    default: return { title: 'Inte riktigt', text: 'Försök igen!' };
  }
}

export function hintKub(q: KubQ): string {
  switch (q.kind) {
    case 'gor': return 'Medurs = som klockan när du tittar rakt på sidan. ′ = moturs.';
    case 'vilket': return 'Titta på vilken rad eller kolumn som rörde sig, och åt vilket håll.';
    case 'bit': return 'Mittbitar har en färg, kantbitar två och hörnbitar tre.';
    case 'valj': return 'Stegen kommer alltid i samma ordning. Vilket är det första som inte är klart?';
    default: return 'Mittbitarna flyttar sig aldrig. De visar var varje bit hör hemma.';
  }
}

// ---------- mål för losa ----------

const nyckel = (f: Farg[]) => f.slice().sort().join('');
const sittande = (k: Kub, filter: (b: Bit) => boolean) => new Set(BITAR.filter((b) => b.typ !== 'mitt' && filter(b) && sitter(k, b)).map((b) => nyckel(farger(k, b))));
const sitterFortfarande = (fore: Kub, k: Kub, filter: (b: Bit) => boolean) =>
  [...sittande(fore, filter)].every((f) => { const b = bitMedFarger(k, f.split('') as Farg[]); return sitter(k, b); });
const nere = (b: Bit) => b.pos[1] === -1;
const mittenKant = (b: Bit) => b.pos[1] === 0;

/** Det som redan var klart sitter kvar. */
function skyddat(q: KubQ, k: Kub): boolean {
  const m = q.mal!;
  switch (m.typ) {
    case 'blomma': return kronblad(k) >= m.n;
    case 'kors': return sitterFortfarande(q.start, k, (b) => nere(b) && b.typ === 'kant');
    case 'horn': return korsKlart(k) && sitterFortfarande(q.start, k, nere);
    case 'mitten': return forstaLagret(k) && sitterFortfarande(q.start, k, mittenKant);
    case 'gulkors': case 'gulkant': case 'gulhorn': return tvaLager(k);
    case 'lost': return true;
  }
}

function natt(q: KubQ, k: Kub): boolean {
  const m = q.mal!;
  switch (m.typ) {
    case 'blomma': return kronblad(k) > m.n;
    case 'kors': return korsKanter(k) > m.n;
    case 'horn': case 'mitten': return sitter(k, bitMedFarger(k, m.bit));
    case 'gulkors': return gultKors(k);
    case 'gulkant': return gultKors(k) && gulaKanterSitter(k);
    case 'gulhorn': return gulaKanterSitter(k) && gulaHornPaPlats(k);
    case 'lost': return arLost(k);
  }
}

/** Målet är nått och inget som var klart har gått sönder. */
export const klart = (q: KubQ, k: Kub) => natt(q, k) && skyddat(q, k);

/** Varför det inte är klart (när barnet trycker Klar). gjorda = dragen barnet har gjort. */
export function diagnosLosa(q: KubQ, k: Kub, gjorda: Drag[]): string {
  const m = q.mal!;
  if (q.mode === 'baklanges' && q.alg) {
    if (k === vrid(q.start, q.alg)) return 'framlanges';
    if (k === vrid(q.start, q.alg.map(invDrag))) return 'ordning';
    if (k === vrid(q.start, q.alg.slice().reverse())) return 'prim';
  }
  // Ett kronblad nere vid fel mittbit kan också knuffa upp en kant som satt – men grundfelet är att U inte vreds först.
  if (m.typ === 'kors' && BITAR.some((b) => b.typ === 'kant' && nere(b) && k[b.platser.find((i) => PLATSER[i].sida === 'D')!] === 'w' && !sitter(k, b))) return 'fel-mitt';
  if (!skyddat(q, k)) return 'forstorde';
  if (m.typ === 'horn' || m.typ === 'mitten') {
    const b = bitMedFarger(k, m.bit);
    if (paPlats(k, b) && !sitter(k, b)) return 'vand-fel';
  }
  return gjorda.length > (q.maxDrag ?? Infinity) ? 'for-manga-drag' : 'inte-klar';
}

/** Felet när barnet trycker m men skulle ha tryckt e. */
export function diagnosDrag(e: Drag, m: Drag): string {
  if (dragBas(m) === dragBas(e)) return dragVarv(e) === 2 ? 'dubbel' : 'prim';
  if (MOTSATT[dragBas(e)] === dragBas(m)) return 'motsatt-sida';
  return 'fel-sida';
}

// ---------- generatorer ----------

const SIDOR6 = ['R', 'L', 'U', 'D', 'F', 'B'];
const clamp = (l: number, max: number) => Math.max(0, Math.min(l, max));

/** n slumpdrag, aldrig samma sida två gånger i rad. */
export function blanda(rng: Rng, n: number, suffix: string[] = ['', "'", '2']): Drag[] {
  const ut: Drag[] = [];
  while (ut.length < n) {
    const f = rng.pick(SIDOR6);
    if (ut.length && dragBas(ut[ut.length - 1]) === f) continue;
    ut.push(f + rng.pick(suffix));
  }
  return ut;
}

/** Ett läge mitt i en lösning: en slumpad kub löses, och en del av lösningen väljs. */
function lage(rng: Rng, ok: (d: Del, i: number, delar: Del[]) => boolean): { del: Del; i: number; delar: Del[] } {
  for (let t = 0; t < 60; t++) {
    const delar = los(vrid(LOST, blanda(rng, 25)));
    const val = delar.map((_, i) => i).filter((i) => ok(delar[i], i, delar));
    if (val.length) { const i = rng.pick(val); return { del: delar[i], i, delar }; }
  }
  throw new Error('Inget läge hittades');
}

/** Första delen i ett steg (läget när steget börjar) och alla stegets drag. */
function helaSteget(rng: Rng, steg: StegId) {
  const { del, i, delar } = lage(rng, (d, j, ds) => d.steg === steg && (j === 0 || ds[j - 1].steg !== steg) && ds.filter((x) => x.steg === steg).some((x) => x.alg.length));
  const alla = delar.slice(i).filter((_, j, rest) => rest.slice(0, j + 1).every((x) => x.steg === steg));
  return { start: del.fore, losning: alla.flatMap(delDrag) };
}

/** Delarna från i tills biten sitter (en fastsittande bit behöver två delar). */
function tillsDetSitter(delar: Del[], i: number): Drag[] {
  const f = delar[i].bit!;
  const ut: Drag[] = [];
  for (let j = i; j < delar.length; j++) {
    ut.push(...delDrag(delar[j]));
    if (sitter(vrid(delar[i].fore, ut), bitMedFarger(vrid(delar[i].fore, ut), f))) return ut;
  }
  return ut;
}

const synlig = (p: number) => ['U', 'F', 'R'].includes(PLATSER[p].sida);
const fargLista = (f: Farg[]) => { const n = f.map((x) => FARGNAMN[x]); return n.length === 2 ? `${n[0]} och ${n[1]}` : `${n[0]}, ${n[1]} och ${n[2]}`; };

const SKILL: Record<string, string> = {
  bitar: 'prog.kub.bitar', vilket: 'prog.kub.vilket', sekvens: 'prog.kub.program', baklanges: 'prog.kub.baklanges',
  blomma: 'prog.kub.blomma', kors: 'prog.kub.kors', horn: 'prog.kub.horn', mitten: 'prog.kub.mitten',
  gulkors: 'prog.kub.gulkors', gulkant: 'prog.kub.gulkant', gulhorn: 'prog.kub.gulhorn', vridhorn: 'prog.kub.vridhorn',
  steg: 'prog.kub.steg', trick: 'prog.kub.utantill', hela: 'prog.kub.hela',
};

export const STEGNAMN: Record<StegId, string> = {
  blomma: 'Blomman', kors: 'Vita korset', horn: 'Vita hörnen', mitten: 'Mittenlagret',
  gulkors: 'Gula korset', gulkant: 'Gula kanterna', gulhorn: 'Gula hörnen på plats', vridhorn: 'Vrid gula hörnen',
};

function bitar(rng: Rng, level: number, base: { mode: string; level: number; skill: string }): KubQ {
  const start = vrid(LOST, blanda(rng, 20));
  // Barnet kan vrida kuben och trycka på baksidan, så alla klistermärken räknas. Bitarna som frågas om syns ändå från början.
  const alla = PLATSER.map((_, i) => i);
  const typAv = (p: number) => BITAR.find((b) => b.platser.includes(p))!.typ;
  if (level === 0) {
    const typ = rng.pick(['mitt', 'kant', 'horn'] as const);
    const ratt = alla.filter((p) => typAv(p) === typ);
    const fel = Object.fromEntries(alla.filter((p) => typAv(p) !== typ).map((p) => [p, typ === 'mitt' || typAv(p) === 'mitt' ? 'mittbit' : 'kant-horn']));
    return { ...base, kind: 'bit', prompt: `Tryck på en ${typ === 'mitt' ? 'mittbit' : typ === 'kant' ? 'kantbit' : 'hörnbit'}.`, start, ratt, fel };
  }
  if (level === 1) {
    const b = rng.pick(BITAR.filter((x) => x.typ !== 'mitt' && x.platser.some(synlig)));
    const f = farger(start, b);
    const ratt = b.platser;
    const fel = Object.fromEntries(alla.filter((p) => !ratt.includes(p)).map((p) => {
      const o = BITAR.find((x) => x.platser.includes(p))!;
      const of = farger(start, o);
      return [p, o.typ === 'mitt' ? 'mittbit' : o.typ !== b.typ && f.every((c) => of.includes(c)) ? 'kant-horn' : 'fel-farger'];
    }));
    return { ...base, kind: 'bit', prompt: `Tryck på ${b.typ === 'kant' ? 'kantbiten' : 'hörnbiten'} som är ${fargLista(f)}.`, start, ratt, fel, fargprick: f };
  }
  // Var hör biten hemma?
  for (let t = 0; t < 200; t++) {
    const k = t < 100 ? start : vrid(LOST, blanda(rng, 20));
    const b = rng.pick(BITAR.filter((x) => x.typ !== 'mitt' && x.platser.some(synlig) && !paPlats(k, x)));
    if (!b) continue;
    const h = hem(k, farger(k, b));
    if (!h.platser.some(synlig)) continue;
    const ratt = h.platser;
    const fel = Object.fromEntries(alla.filter((p) => !ratt.includes(p)).map((p) => [p, 'fel-plats']));
    return { ...base, kind: 'bit', prompt: 'Var hör biten som lyser hemma? Tryck på platsen där den ska sitta.', start: k, ratt, fel, markera: b.platser, fargprick: farger(k, b) };
  }
  throw new Error('Ingen bit att flytta');
}

function vilket(rng: Rng, level: number, base: { mode: string; level: number; skill: string }, trap?: string): KubQ {
  const prim = level >= 1 && (trap === 'prim' || rng.next() < 0.5);
  const f = rng.pick(SIDOR6);
  const drag = prim ? `${f}'` : f;
  const alts: Alt[] = [{ label: drag }];
  if (level >= 1) alts.push({ label: invDrag(drag), err: 'prim' });
  alts.push({ label: MOTSATT[f] + (prim ? "'" : ''), err: 'motsatt-sida' });
  for (const o of rng.shuffle(SIDOR6.filter((x) => x !== f && x !== MOTSATT[f]))) {
    if (alts.length >= 4) break;
    alts.push({ label: o + (level >= 1 && rng.next() < 0.5 ? "'" : ''), err: 'fel-sida' });
  }
  return { ...base, kind: 'vilket', prompt: 'Titta på kuben! Vilket drag gjordes?', start: LOST, drag, alts: rng.shuffle(alts) };
}

const gor = (base: { mode: string; level: number; skill: string }, prompt: string, start: Kub, alg: Drag[], extra: Partial<KubQ> = {}): KubQ =>
  ({ ...base, kind: 'gor', prompt, start, alg, ...extra });

/** Kubprogrammet utantill: läget där det används. */
const TRICK_STEG: Record<AlgId, StegId> = { hoger: 'horn', ner: 'vridhorn', 'mitten-h': 'mitten', 'mitten-v': 'mitten', gulkors: 'gulkors', gulkant: 'gulkant', gulhorn: 'gulhorn' };

function trick(rng: Rng, level: number, base: { mode: string; level: number; skill: string }): KubQ {
  const id = rng.pick<AlgId>(level === 0 ? ['hoger', 'ner', 'gulkors'] : ['hoger', 'ner', 'gulkors', 'mitten-h', 'mitten-v', 'gulkant', 'gulhorn']);
  const { del } = lage(rng, (d) => d.steg === TRICK_STEG[id] && d.algId === id && !d.lossnar);
  return gor(base, `Gör kubprogrammet ${ALG[id].namn.toLowerCase()} utantill!`, vrid(del.fore, del.forbered), ALG[id].drag, { dold: true });
}

export function makeKub(spec: QuestionSpec, rng: Rng): KubQ {
  let mode = spec.mode;
  let level = spec.level;
  if (mode === 'blandat') {
    const val: [string, number][] = level >= 1
      ? [['horn', 1], ['mitten', 1], ['gulkors', 1], ['gulkant', 1], ['gulhorn', 0], ['vridhorn', 0], ['steg', 1], ['trick', 1], ['baklanges', 0]]
      : [['bitar', 1], ['bitar', 2], ['drag', 1], ['vilket', 1], ['sekvens', 1], ['kors', 1], ['trick', 0]];
    [mode, level] = rng.pick(val);
  }
  if (mode === 'gul') [mode, level] = rng.pick<[string, number]>([['gulkors', 1], ['gulkant', 1], ['gulhorn', 1], ['vridhorn', 1]]);
  const skill = mode === 'drag' ? (level >= 1 ? 'prog.kub.prim' : 'prog.kub.drag') : SKILL[mode] ?? 'prog.kub.drag';
  const b = (max: number) => ({ mode, level: clamp(level, max), skill });

  switch (mode) {
    case 'bitar': return bitar(rng, clamp(level, 2), b(2));
    case 'drag': {
      const l = clamp(level, 1);
      const d = l === 0 ? rng.pick(SIDOR6) : rng.pick(SIDOR6) + (spec.trap === 'prim' || rng.next() < 0.65 ? "'" : '2');
      return gor(b(1), `Gör draget ${d.replace("'", '′')}.`, l === 0 ? LOST : vrid(LOST, blanda(rng, 3)), [d]);
    }
    case 'vilket': return vilket(rng, clamp(level, 1), b(1), spec.trap);
    case 'sekvens': {
      const l = clamp(level, 1);
      const alg = l === 0 ? blanda(rng, 2 + rng.int(2), ['']) : blanda(rng, 4 + rng.int(2));
      if (spec.trap === 'prim' && !alg.some((d) => d.endsWith("'"))) alg[alg.length - 1] = `${dragBas(alg[alg.length - 1])}'`;
      return gor(b(1), 'Gör kubprogrammet, ett drag i taget.', LOST, alg);
    }
    case 'baklanges': {
      const alg = blanda(rng, 2 + rng.int(2));
      return {
        ...b(0), kind: 'losa', prompt: 'Kuben blandades med kubprogrammet här. Lös den genom att göra programmet baklänges!',
        start: vrid(LOST, alg), alg, mal: { typ: 'lost' }, losning: inv(alg), maxDrag: alg.length * 3 + 4,
      };
    }
    case 'blomma': {
      const l = clamp(level, 1);
      const { del } = lage(rng, (d) => d.steg === 'blomma' && (l === 0 ? d.alg.length <= 2 : d.alg.length >= 2));
      const n = kronblad(del.fore);
      return {
        ...b(1), kind: 'losa', prompt: `Gör ett kronblad till: en vit kant med vitt uppåt, runt den gula mitten. Nu har blomman ${n === 0 ? 'inga' : n} kronblad.`,
        start: del.fore, mal: { typ: 'blomma', n }, losning: delDrag(del), maxDrag: 14, underifran: true,
      };
    }
    case 'kors': {
      const l = clamp(level, 1);
      const sva = l >= 1 || spec.trap === 'fel-mitt';
      const { del } = lage(rng, (d) => d.steg === 'kors' && (sva ? d.forbered.length > 0 : d.forbered.length === 0));
      return {
        ...b(1), kind: 'losa', prompt: 'Flytta ner ett kronblad till den vita sidan, så att färgerna passar mittbitarna.',
        start: del.fore, mal: { typ: 'kors', n: korsKanter(del.fore) }, losning: delDrag(del), maxDrag: 12, underifran: true,
      };
    }
    case 'horn': {
      const l = clamp(level, 2);
      const { del, i, delar } = lage(rng, (d) => d.steg === 'horn' && (l === 0 ? !d.lossnar && d.forbered.length === 0 : l === 1 ? !d.lossnar && d.forbered.length > 0 : !!d.lossnar));
      const prompt = l === 0 ? 'Det lysande hörnet står ovanför sin plats, fram till höger. Sätt ner det med höger-tricket!'
        : l === 1 ? 'Sätt in det lysande hörnet på sin plats i det vita lagret.'
        : 'Det lysande hörnet har fastnat på fel plats. Få loss det och sätt in det rätt!';
      const losning = l === 2 ? tillsDetSitter(delar, i) : delDrag(del);
      return {
        ...b(2), kind: 'losa', prompt, start: del.fore, mal: { typ: 'horn', bit: del.bit! }, losning,
        maxDrag: losning.length * 2 + 12, rotera: l >= 1, underifran: true, markera: bitMedFarger(del.fore, del.bit!).platser,
      };
    }
    case 'mitten': {
      const l = clamp(level, 2);
      const { del, i, delar } = lage(rng, (d) => d.steg === 'mitten' && (l === 2 ? !!d.lossnar : !d.lossnar));
      if (l === 0) {
        const start = vrid(del.fore, del.forbered);
        const vart = del.algId === 'mitten-h' ? 'åt höger' : 'åt vänster';
        return gor(b(2), `Den lysande kanten ska ner ${vart}. Gör kubprogrammet ${ALG[del.algId!].namn.toLowerCase()}!`, start, del.alg,
          { markera: bitMedFarger(start, del.bit!).platser, underifran: true });
      }
      const losning = l === 2 ? tillsDetSitter(delar, i) : delDrag(del);
      return {
        ...b(2), kind: 'losa', start: del.fore, mal: { typ: 'mitten', bit: del.bit! }, losning, maxDrag: losning.length * 2 + 12, rotera: true, underifran: true,
        prompt: l === 1 ? 'Sätt in den lysande kanten i mittenlagret.' : 'Den lysande kanten har fastnat på fel plats i mittenlagret. Få loss den och sätt in den rätt!',
        markera: bitMedFarger(del.fore, del.bit!).platser,
      };
    }
    case 'gulkors': case 'gulkant': case 'gulhorn': case 'vridhorn': {
      const steg = mode as 'gulkors' | 'gulkant' | 'gulhorn' | 'vridhorn';
      const l = clamp(level, 1);
      if (l === 0) {
        const { del } = lage(rng, (d) => d.steg === steg && d.alg.length > 0);
        const start = vrid(del.fore, del.forbered);
        const id = del.algId!;
        const prompt = steg === 'gulkors' ? `Gula toppen är ${({ prick: 'en prick', L: 'ett L bak till vänster', linje: 'en liggande linje', kors: 'ett kors' })[gulFormFri(start)]}. Gör kubprogrammet gula korset!`
          : steg === 'gulkant' ? 'Två kanter passar redan. Gör kubprogrammet gula kanterna!'
          : steg === 'gulhorn' ? 'Hörnet fram till höger är på rätt plats. Gör kubprogrammet gula hörnen!'
          : `Gör ner-tricket ${del.ganger === 2 ? 'två' : 'fyra'} gånger, tills gult pekar uppåt på hörnet fram till höger.`;
        return gor(b(1), prompt, start, del.alg, { topp: steg !== 'vridhorn', grupp: id === 'ner' ? 4 : undefined, underifran: steg === 'vridhorn', markera: steg === 'vridhorn' ? bitMedFarger(start, del.bit!).platser : undefined });
      }
      const { start, losning } = helaSteget(rng, steg);
      const prompt = steg === 'gulkors' ? 'Gör ett gult kors på toppen!' : steg === 'gulkant' ? 'Få alla gula kanter att passa mittbitarna!'
        : steg === 'gulhorn' ? 'Flytta de gula hörnen till rätt platser! (De får vara vända fel.)' : 'Vrid de gula hörnen rätt och lös kuben!';
      return {
        ...b(1), kind: 'losa', prompt, start, mal: { typ: steg === 'vridhorn' ? 'lost' : steg }, losning, maxDrag: losning.length * 2 + 16,
        rotera: steg !== 'gulkors', topp: steg !== 'vridhorn', underifran: steg === 'vridhorn',
      };
    }
    case 'steg': {
      const l = clamp(level, 1);
      const steg = rng.pick<StegId>(l === 0 ? STEG : ['gulkors', 'gulkant', 'gulhorn', 'vridhorn']);
      const { start } = helaSteget(rng, steg);
      if (l === 0) {
        const andra = rng.shuffle(STEG.filter((s) => s !== steg)).slice(0, 3);
        return { ...b(1), kind: 'valj', prompt: 'Vilket steg ska du göra nu? Titta både ovanifrån och underifrån.', start, underifran: true,
          alts: rng.shuffle([{ label: STEGNAMN[steg] }, ...andra.map((s) => ({ label: STEGNAMN[s], err: 'fel-steg' }))]) };
      }
      const knep: Record<string, AlgId> = { gulkors: 'gulkors', gulkant: 'gulkant', gulhorn: 'gulhorn', vridhorn: 'ner' };
      return { ...b(1), kind: 'valj', prompt: 'Vilket kubprogram behövs nu?', start, topp: true,
        alts: (['gulkors', 'gulkant', 'gulhorn', 'vridhorn'] as const).map((s) => ({ label: ALG[knep[s]].namn, err: s === steg ? undefined : 'fel-knep' })) };
    }
    case 'trick': return trick(rng, clamp(level, 1), b(1));
    case 'hela': {
      const start = vrid(LOST, blanda(rng, 22));
      return { ...b(0), kind: 'losa', prompt: 'Lös hela kuben, steg för steg!', start, mal: { typ: 'lost' }, losning: los(start).flatMap(delDrag), rotera: true, underifran: true, hela: true };
    }
    default: return makeKub({ ...spec, mode: 'drag' }, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m: Record<string, QuestionSpec[]> = {
    'prog.kub.bitar': [{ mode: 'bitar', level: 0 }, { mode: 'bitar', level: 1 }, { mode: 'bitar', level: 2 }],
    'prog.kub.drag': [{ mode: 'drag', level: 0 }],
    'prog.kub.prim': [{ mode: 'drag', level: 1 }],
    'prog.kub.vilket': [{ mode: 'vilket', level: 0 }, { mode: 'vilket', level: 1 }],
    'prog.kub.program': [{ mode: 'sekvens', level: 0 }, { mode: 'sekvens', level: 1 }],
    'prog.kub.baklanges': [{ mode: 'baklanges', level: 0 }],
    'prog.kub.blomma': [{ mode: 'blomma', level: 0 }, { mode: 'blomma', level: 1 }],
    'prog.kub.kors': [{ mode: 'kors', level: 0 }, { mode: 'kors', level: 1 }],
    'prog.kub.horn': [{ mode: 'horn', level: 0 }, { mode: 'horn', level: 1 }],
    'prog.kub.mitten': [{ mode: 'mitten', level: 0 }, { mode: 'mitten', level: 1 }],
    'prog.kub.gulkors': [{ mode: 'gulkors', level: 0 }],
    'prog.kub.gulkant': [{ mode: 'gulkant', level: 0 }],
    'prog.kub.gulhorn': [{ mode: 'gulhorn', level: 0 }],
    'prog.kub.vridhorn': [{ mode: 'vridhorn', level: 0 }],
    'prog.kub.steg': [{ mode: 'steg', level: 0 }, { mode: 'steg', level: 1 }],
    'prog.kub.utantill': [{ mode: 'trick', level: 0 }],
  };
  return m[skill] ?? [];
}
