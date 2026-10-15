import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';
import { axisFor, sum, type Chart } from '../../engines/diagram/chart';
import type { Alt } from '../../engines/diagram/types';
import { fmtNum } from '../../engines/drill/check';
import { cands, type Base, type DQ, type Extra } from './gen';
import { kurva } from './vader';

// Skvallerpressen (åk 4–6): knep i berättelsen runt diagrammet. Rubriker som inte stämmer, bara en bit av året
// (Russinplockaren), totalen som ser ut som ökning, cirklar som blir mer än 100 %, för få som svarat
// (Fåfrågaren), totalt eller per person, och samband som inte är orsak (Glassmonstret).
// Sant / Falskt / Går inte att veta – och ibland stämmer rubriken faktiskt. Lägen, färdighets-id:n och felkoder är permanenta.

type M = 'rubrik' | 'utsnitt' | 'summerad' | 'hundra' | 'urval' | 'perperson' | 'samband';
const MODES: M[] = ['rubrik', 'utsnitt', 'summerad', 'hundra', 'urval', 'perperson', 'samband'];
const MAX: Record<M, number> = { rubrik: 1, utsnitt: 1, summerad: 1, hundra: 1, urval: 1, perperson: 1, samband: 1 };

const SANT = 'Sant', FALSKT = 'Falskt', VET_INTE = 'Går inte att veta';

export const PRESS_ERR: Record<string, string> = {
  'trodde-rubriken': 'Tror på en rubrik som inte stämmer med diagrammet',
  'kan-veta': 'Ser inte att diagrammet visar svaret',
  'vet-inte-falskt': 'Säger att det är fel fast det inte går att veta',
  'fa-svar': 'Litar på en undersökning där för få har svarat',
  utsnitt: 'Luras av att bara en bit av tiden visas',
  'summerad-lurar': 'Läser totalen som om den var varje månad',
  'ej-hundra': 'Ser inte att bitarna blir mer än 100 %',
  'totalt-per-person': 'Jämför totalt i stället för per person',
  'samband-orsak': 'Tror att det ena orsakar det andra för att de ökar samtidigt',
  'ser-fusk-overallt': 'Tror att något lurar fast det stämmer',
  'fel-knep': 'Hittar ett knep som inte finns',
};

export const pressExtra: Extra = {
  err: PRESS_ERR,
  explain(tag) {
    switch (tag) {
      case 'trodde-rubriken':
        return { title: 'Lita inte på rubriken', text: 'Rubriker vill att man ska bli förvånad. Läs själv av diagrammet, och jämför med vad rubriken säger. Kolla axeln också!' };
      case 'kan-veta':
        return { title: 'Det går att veta', text: 'Allt du behöver står i diagrammet. Läs av talen och jämför med rubriken.' };
      case 'vet-inte-falskt':
        return { title: 'Vet vi det?', text: 'Kan man säga att rubriken är fel? Kolla hur många som fick svara. Räcker det för att veta vad hela byn tycker?' };
      case 'fa-svar':
        return { title: 'För få svar', text: 'Kolla hur många som svarade. Om bara några få av alla i byn fick frågan, kan man inte veta vad alla tycker.' };
      case 'utsnitt':
        return { title: 'Bara en bit', text: 'Tidningen visar bara några månader. Titta på hela året: vad händer före och efter?' };
      case 'summerad-lurar':
        return { title: 'Totalt, inte varje månad', text: 'Diagrammet visar hur många det har blivit totalt sedan början – inte hur många varje månad. Det som kom till en månad är skillnaden mot månaden innan.' };
      case 'ej-hundra':
        return { title: 'Mer än hela', text: 'Hela cirkeln är alla: 100 procent. Lägg ihop procenten vid bitarna. Blir det mer än 100 stämmer något inte.' };
      case 'totalt-per-person':
        return { title: 'Fler bor där', text: 'I en stor by bor många, så där blir det mycket totalt. Men hur mycket blir det för varje person? Dela med hur många som bor i byn.' };
      case 'samband-orsak':
        return { title: 'Samband är inte orsak', text: 'Två saker kan öka samtidigt utan att den ena orsakar den andra. Finns det något tredje – som vädret eller årstiden – som får båda att öka?' };
      case 'ser-fusk-overallt':
        return { title: 'Den här stämmer', text: 'Kolla igen: läs av diagrammet och jämför med rubriken. Alla rubriker lurar inte!' };
      case 'fel-knep':
        return { title: 'Ett annat knep', text: 'Det knepet finns inte här. Titta på vad tidningen visar – och på vad den inte visar.' };
      default:
        return undefined;
    }
  },
};

/** Sant / Falskt / Går inte att veta, med felkoden för varje fel svar. */
function sant(right: string, tags: { sant?: string; falskt?: string; vet?: string }): Alt[] {
  const alt = (text: string, tag?: string) => (text === right ? { text } : { text, err: tag! });
  return [alt(SANT, tags.sant), alt(FALSKT, tags.falskt), alt(VET_INTE, tags.vet)];
}

const stapel = (titel: string, enhet: string, kat: string[], v: number[], axel: Chart['axel'], extra: Partial<Chart> = {}): Chart => ({
  typ: 'stapel', titel, enhet, katNamn: '', kat, serier: [{ namn: titel, v }], axel, talPa: true, ...extra,
});

/* ---------- rubriker ---------- */

const SAKER = [
  { titel: 'Sålda glassar', enhet: 'glassar', sak: 'Glassförsäljningen' },
  { titel: 'Besökare på museet', enhet: 'besökare', sak: 'Antalet besökare' },
  { titel: 'Sålda cyklar', enhet: 'cyklar', sak: 'Cykelförsäljningen' },
  { titel: 'Lånade böcker på biblioteket', enhet: 'böcker', sak: 'Boklånen' },
];
const GANGER: Record<number, string> = { 2: 'fördubblats', 3: 'tredubblats', 4: 'fyrdubblats' };

function rubrik(b: Base, rng: Rng): DQ | null {
  const s = rng.pick(SAKER);
  if (b.level === 0) {
    // Vem är störst? Rubriken pekar ut en av staplarna.
    const kat = ['Talby', 'Ekby', 'Kustby', 'Bergby'].slice(0, 3 + rng.int(2));
    const v = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, kat.length).map((x) => x * 10);
    const top = v.indexOf(Math.max(...v)), pekad = rng.next() < 0.5 ? top : rng.int(kat.length);
    const right = pekad === top ? SANT : FALSKT;
    return {
      ...b, kind: 'sant', rubrik: `${kat[pekad]} slår alla! Mest ${s.enhet} i hela dalen!`, prompt: 'Stämmer rubriken med diagrammet?',
      chart: stapel(`${s.titel} i byarna`, s.enhet, kat, v, axisFor(100, 10)), answer: right,
      alts: sant(right, { sant: 'trodde-rubriken', falskt: 'ser-fusk-overallt', vet: 'kan-veta' }), visa: [top],
      los: `Högst stapel har ${kat[top]} med ${fmtNum(v[top])} ${s.enhet}. ${right === SANT ? 'Rubriken stämmer.' : `Rubriken stämmer inte: ${kat[pekad]} har bara ${fmtNum(v[pekad])}.`}`,
      tips: 'Läs av talen vid alla staplar. Vilken är störst – är det den som rubriken säger?',
    };
  }
  // Har det fördubblats? Ibland stämmer det; ibland är det bara axeln som får det att se ut så.
  const k = rng.pick([2, 3, 4]), kat = ['I fjol', 'I år'];
  if (rng.next() < 0.4) {
    const f = rng.pick([5, 10, 15, 20]), l = f * k;
    return {
      ...b, kind: 'sant', rubrik: `${s.sak} har ${GANGER[k]}!`, prompt: 'Stämmer rubriken med diagrammet?',
      chart: stapel(s.titel, s.enhet, kat, [f, l], axisFor(l + 10, 10)), answer: SANT,
      alts: sant(SANT, { falskt: 'ser-fusk-overallt', vet: 'kan-veta' }), visa: [0, 1],
      los: `I fjol ${fmtNum(f)}, i år ${fmtNum(l)}. ${fmtNum(f)} · ${k} = ${fmtNum(l)}. Rubriken stämmer.`,
      tips: 'Läs talen vid båda staplarna. Hur många gånger så stort är talet i år?',
    };
  }
  const L = rng.pick([40, 60, 80]), f = L + 2, l = L + 2 * k;
  return {
    ...b, kind: 'sant', rubrik: `${s.sak} har ${GANGER[k]}!`, prompt: 'Stämmer rubriken med diagrammet?',
    chart: stapel(s.titel, s.enhet, kat, [f, l], { min: 0, max: L + 10, steg: 10 }, { lur: { axelStart: L } }), answer: FALSKT, sanning: true,
    alts: sant(FALSKT, { sant: 'trodde-rubriken', vet: 'kan-veta' }), visa: [0, 1],
    los: `I fjol ${fmtNum(f)}, i år ${fmtNum(l)}. Det är bara lite mer – det ser stort ut för att axeln börjar på ${fmtNum(L)}.`,
    tips: 'Läs talen vid staplarna i stället för att titta på hur höga de är. Var börjar axeln?',
  };
}

/* ---------- russinplockning ---------- */

const MANADER = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

function linje(titel: string, enhet: string, kat: string[], v: number[]): Chart {
  return { typ: 'linje', titel, enhet, katNamn: 'Månad', kat, serier: [{ namn: titel, v }], axel: axisFor(Math.max(...v) + 5, 10) };
}

function utsnitt(b: Base, rng: Rng, trap?: string): DQ | null {
  const s = rng.pick(SAKER);
  const arligt = b.level === 0 && !trap && rng.next() < 0.25;
  const kat = MANADER.slice(3, 10); // april till oktober
  const v = kurva(arligt ? 'vaxt' : 'dag', kat.length, 10, 90, 5, rng);
  const top = v.indexOf(Math.max(...v));
  if (!arligt && (top < 2 || top === kat.length - 1)) return null;
  // Tidningen visar bara bitarna fram till toppen (när det ökar).
  const fran = arligt ? kat.length - 3 : Math.max(0, top - 2 - rng.int(Math.max(1, top - 1)));
  const till = arligt ? kat.length : top + 1;
  const tidning = linje(`${s.titel} (i tidningen)`, s.enhet, kat.slice(fran, till), v.slice(fran, till));
  const hela = linje(`${s.titel} hela året`, s.enhet, kat, v);
  const base = { ...b, chart: tidning, kalla: hela, bredvid: true, rubrik: `${s.sak} ökar och ökar!` };
  if (b.level === 0) {
    const right = arligt ? SANT : FALSKT;
    return {
      ...base, kind: 'sant', prompt: 'Tidningen visar diagrammet till höger. Stämmer rubriken för hela året?', answer: right,
      alts: sant(right, arligt ? { falskt: 'ser-fusk-overallt', vet: 'kan-veta' } : { sant: 'utsnitt', vet: 'kan-veta' }),
      los: arligt ? 'Linjen går uppåt hela året. Rubriken stämmer.' : `Tidningen visar bara ${kat[fran]} till ${kat[top]}, när det ökar. Efter ${kat[top]} minskar det igen.`,
      tips: 'Jämför tidningens diagram med diagrammet för hela året. Går linjen uppåt hela tiden?',
    };
  }
  return {
    ...base, kind: 'val', prompt: 'Varför ser det ut som att det bara ökar i tidningen?', answer: 'Tidningen visar bara en bit av året',
    alts: rng.shuffle([
      { text: 'Tidningen visar bara en bit av året' },
      { text: 'Det ökar hela året', err: 'utsnitt' },
      { text: 'Axeln börjar inte på 0', err: 'fel-knep' },
    ]),
    los: `Tidningen har plockat ut ${kat[fran]} till ${kat[top]}. Efter det minskar det – men det visar inte tidningen.`,
    tips: 'Vilka månader finns med i tidningens diagram? Vilka månader saknas?',
  };
}

/* ---------- totalen ---------- */

function summerad(b: Base, rng: Rng): DQ | null {
  const kat = MANADER.slice(0, 6);
  const okar = b.level === 1 && rng.next() < 0.25;
  const per = rng.shuffle([5, 10, 15, 20, 25, 30, 35, 40]).slice(0, 6).sort((x, y) => (okar ? x - y : y - x));
  if (b.level === 0) for (let i = 0; i < 2; i++) { const a = rng.int(6), c = rng.int(6); [per[a], per[c]] = [per[c], per[a]]; }
  const tot = per.map((_, i) => sum(per.slice(0, i + 1)));
  const chart = { ...linje('Sålda cyklar totalt, sedan januari', 'cyklar', kat, tot), talPa: true };
  chart.axel = axisFor(tot[5] + 10, 20);
  if (b.level === 0) {
    const i = 1 + rng.int(5);
    if (tot.includes(per[i])) return null;
    return {
      ...b, kind: 'las', prompt: `Hur många cyklar såldes bara i ${kat[i].toLocaleLowerCase('sv')}?`, chart, answer: String(per[i]),
      cand: cands(per[i], [[tot[i], 'summerad-lurar'], [tot[i - 1], 'svarade-varde'], [tot[i] + tot[i - 1], 'summa-skillnad']]), visa: [i - 1, i],
      los: `Totalt efter ${kat[i]}: ${fmtNum(tot[i])}. Totalt efter ${kat[i - 1]}: ${fmtNum(tot[i - 1])}. ${fmtNum(tot[i])} − ${fmtNum(tot[i - 1])} = ${fmtNum(per[i])}.`,
      tips: 'Diagrammet visar totalen. Det som såldes en månad är skillnaden mot månaden innan.',
    };
  }
  const right = okar ? SANT : FALSKT;
  return {
    ...b, kind: 'sant', rubrik: 'Cykelförsäljningen ökar varje månad!', prompt: 'Stämmer rubriken?', chart, answer: right,
    alts: sant(right, okar ? { falskt: 'summerad-lurar', vet: 'kan-veta' } : { sant: 'summerad-lurar', vet: 'kan-veta' }),
    los: `Varje månad såldes ${per.map(fmtNum).join(', ')} cyklar. ${okar ? 'Det blir fler varje månad – rubriken stämmer.' : 'Det blir färre varje månad! Linjen går uppåt bara för att den visar totalen.'}`,
    tips: 'Linjen visar totalen. Räkna ut hur många som såldes varje månad: skillnaden mot månaden innan.',
  };
}

/* ---------- cirklar över 100 % ---------- */

const PIE_TEMA = [
  { titel: 'Favoritfrukt i klassen', kat: ['Äpple', 'Banan', 'Päron', 'Kiwi'], ikoner: ['🍎', '🍌', '🍐', '🥝'] },
  { titel: 'Favoritsport i byn', kat: ['Fotboll', 'Simning', 'Ridning', 'Skidor'], ikoner: ['⚽', '🏊', '🏇', '⛷️'] },
];

function hundra(b: Base, rng: Rng): DQ | null {
  const t = rng.pick(PIE_TEMA);
  const n = 3 + rng.int(2);
  const p = rng.shuffle([10, 15, 20, 25, 30, 35, 40]).slice(0, n - 1);
  p.push(100 - sum(p));
  if (p[n - 1] <= 0 || new Set(p).size < n) return null;
  const extra = p.map(() => 0);
  extra[rng.int(n)] = rng.pick([10, 15, 20]);
  extra[rng.int(n)] += rng.pick([5, 10]);
  const visad = p.map((x, i) => x + extra[i]), tot = sum(visad);
  const chart: Chart = {
    typ: 'cirkel', titel: t.titel, enhet: 'röster', katNamn: '', kat: t.kat.slice(0, n), ikoner: t.ikoner.slice(0, n),
    serier: [{ namn: t.titel, v: p }], axel: axisFor(100, 10), etikett: 'procent', lur: { ejHundra: visad },
  };
  if (b.level === 0) {
    return {
      ...b, kind: 'val', prompt: 'Vad är fel med cirkeldiagrammet?', chart, answer: 'Procenten blir mer än 100 tillsammans', sanning: true,
      alts: rng.shuffle([
        { text: 'Procenten blir mer än 100 tillsammans' },
        { text: 'Inget, diagrammet stämmer', err: 'ej-hundra' },
        { text: 'Bitarna har olika färger', err: 'fel-knep' },
      ]),
      los: `${visad.map((x) => `${fmtNum(x)} %`).join(' + ')} = ${fmtNum(tot)} %. Men hela cirkeln är bara 100 %!`,
      tips: 'Hela cirkeln är 100 procent. Lägg ihop procenten vid bitarna.',
    };
  }
  return {
    ...b, kind: 'las', prompt: 'Hur många procent blir bitarna tillsammans?', chart, answer: String(tot), enhet: '%', sanning: true,
    cand: cands(tot, [[100, 'ej-hundra']]),
    los: `${visad.map(fmtNum).join(' + ')} = ${fmtNum(tot)}. Det är mer än 100 %, så diagrammet kan inte stämma.`,
    tips: 'Lägg ihop alla procenttalen vid bitarna, ett i taget.',
  };
}

/* ---------- för få svar ---------- */

const ENKAT = ['lakrits är godast', 'det ska vara skoldisco varje vecka', 'katter är bättre än hundar', 'det är för lite snö på vintern'];

function urval(b: Base, rng: Rng, trap?: string): DQ | null {
  const sak = rng.pick(ENKAT), N = rng.pick([400, 600, 800]);
  const fa = !!trap || b.level === 1 || rng.next() < 0.5;
  const n = fa ? 3 + rng.int(4) : N / 2 + 10 * rng.int(10);
  const ja = fa ? n - 1 - rng.int(Math.min(2, n - 2)) : rng.next() < 0.6 ? Math.round(n * 0.7) : Math.round(n * 0.3);
  const chart: Chart = {
    typ: 'tabell', titel: `Tidningen frågade ${fmtNum(n)} av byns ${fmtNum(N)} invånare`, enhet: 'svar', katNamn: 'Svar', kat: ['Ja', 'Nej'], ikoner: ['👍', '👎'],
    serier: [{ namn: 'Svar', v: [ja, n - ja] }], axel: axisFor(n, 1),
  };
  const rubrikText = `De flesta i byn tycker att ${sak}!`;
  if (b.level === 1) {
    return {
      ...b, kind: 'val', rubrik: rubrikText, prompt: 'Varför kan man inte lita på rubriken?', chart, answer: 'För få har svarat',
      alts: rng.shuffle([{ text: 'För få har svarat' }, { text: 'Man kan visst lita på den', err: 'fa-svar' }, { text: 'Tabellen är fel ritad', err: 'fel-knep' }]),
      los: `Bara ${fmtNum(n)} av ${fmtNum(N)} fick svara. Det säger inget om vad alla i byn tycker.`,
      tips: 'Läs rubriken över tabellen. Hur många fick svara – och hur många bor i byn?',
    };
  }
  const flest = ja > n - ja;
  const right = fa ? VET_INTE : flest ? SANT : FALSKT;
  return {
    ...b, kind: 'sant', rubrik: rubrikText, prompt: 'Stämmer rubriken?', chart, answer: right,
    alts: sant(right, fa ? { sant: 'fa-svar', falskt: 'vet-inte-falskt' } : flest ? { falskt: 'jamforde-fel', vet: 'ser-fusk-overallt' } : { sant: 'trodde-rubriken', vet: 'ser-fusk-overallt' }),
    los: fa
      ? `Bara ${fmtNum(n)} av ${fmtNum(N)} fick svara. Det går inte att veta vad de andra tycker.`
      : `Över hälften av byn svarade, och ${flest ? 'de flesta' : 'bara några av dem'} sa ja (${fmtNum(ja)} av ${fmtNum(n)}). Rubriken ${flest ? 'stämmer' : 'stämmer inte'}.`,
    tips: 'Kolla först hur många som fick svara. Räcker det för att veta vad alla i byn tycker?',
  };
}

/* ---------- totalt och per person ---------- */

const BYAR: [string, number][] = [['Storby', 1000], ['Mellanby', 200], ['Lillby', 50]];

function perperson(b: Base, rng: Rng): DQ | null {
  const rate = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3);
  const tot = BYAR.map(([, n], i) => n * rate[i]);
  const best = rate.indexOf(Math.max(...rate)), most = tot.indexOf(Math.max(...tot));
  if (best === most) return null;
  const namn = BYAR.map(([x]) => x);
  const chart = stapel('Glassar som åts i somras', 'glassar', namn, tot, axisFor(Math.max(...tot) + 500, 1000));
  const kalla: Chart = {
    typ: 'tabell', titel: 'Hur många som bor i byarna', enhet: 'invånare', katNamn: 'By', kat: namn, ikoner: ['🏙️', '🏘️', '🏡'],
    serier: [{ namn: 'Invånare', v: BYAR.map(([, n]) => n) }], axel: axisFor(1000, 100),
  };
  if (b.level === 0) {
    const third = [0, 1, 2].find((i) => i !== best && i !== most)!;
    return {
      ...b, kind: 'val', rubrik: `${namn[most]} äter mest glass i hela dalen!`, prompt: 'I vilken by åt varje person flest glassar?', chart, kalla, answer: namn[best],
      alts: [{ text: namn[best] }, { text: namn[most], err: 'totalt-per-person' }, { text: namn[third], err: 'jamforde-fel' }], visa: [best],
      los: BYAR.map(([x, n], i) => `${x}: ${fmtNum(tot[i])} / ${fmtNum(n)} = ${rate[i]}`).join('. ') + ` glassar per person. Mest i ${namn[best]}.`,
      tips: 'Dela antalet glassar med hur många som bor i byn. Då får du hur många varje person åt.',
    };
  }
  const i = rng.int(3);
  return {
    ...b, kind: 'las', prompt: `Hur många glassar åt varje person i ${namn[i]}?`, chart, kalla, answer: String(rate[i]),
    cand: cands(rate[i], [[tot[i], 'totalt-per-person'], [BYAR[i][1], 'svarade-varde']]), visa: [i],
    los: `${fmtNum(tot[i])} glassar delat på ${fmtNum(BYAR[i][1])} personer: ${fmtNum(tot[i])} / ${fmtNum(BYAR[i][1])} = ${rate[i]}.`,
    tips: 'Läs av hur många glassar som åts i byn, och hur många som bor där. Dela sedan.',
  };
}

/* ---------- samband och orsak ---------- */

/** [första linjen, andra linjen, den riktiga förklaringen, två felaktiga, vilka månader båda topparna ligger i]. */
const PAR: [string, string, string, string, string, 'sommar' | 'vinter'][] = [
  ['Sålda glassar', 'Barn med solbränna', 'Det är varmt och soligt på sommaren', 'Glass ger solbränna', 'Solbränna gör att man vill äta glass', 'sommar'],
  ['Badande vid stranden', 'Sålda solglasögon', 'Det är varmt och soligt på sommaren', 'Solglasögon gör att man badar', 'Bad gör att man köper solglasögon', 'sommar'],
  ['Sålda vantar', 'Halkolyckor', 'Det är kallt och isigt på vintern', 'Vantar gör att man halkar', 'Halka gör att man köper vantar', 'vinter'],
  ['Snögubbar i parken', 'Sålda pulkor', 'Det är mycket snö på vintern', 'Snögubbar gör att man köper pulkor', 'Pulkor gör att man bygger snögubbar', 'vinter'],
];

function samband(b: Base, rng: Rng): DQ | null {
  const [a, c, ratt, fel1, fel2, tid] = rng.pick(PAR);
  const kat = tid === 'sommar' ? MANADER.slice(3, 10) : ['Okt', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const top = 3;
  // Båda linjerna stiger till en topp i samma månad och sjunker sedan.
  const form = (lo: number) => {
    const s = kurva('vaxt', 7, lo, lo + 60, 5, rng);
    const max = s.pop()!;
    const rest = rng.shuffle(s);
    return [...rest.slice(0, top).sort((a, b) => a - b), max, ...rest.slice(top).sort((a, b) => b - a)];
  };
  const v1 = form(10), v2 = form(5);
  const kalla = linje(a, '', kat, v1), chart = linje(c, '', kat, v2);
  return {
    ...b, kind: 'val', rubrik: b.level === 1 ? `Forskare: ${fel1}!` : undefined,
    prompt: b.level === 1 ? 'Båda linjerna har sin topp samtidigt. Vad är den troliga förklaringen?' : 'Båda linjerna går upp och ner samtidigt. Varför?',
    chart, kalla, bredvid: true, answer: ratt,
    alts: rng.shuffle([{ text: ratt }, { text: fel1, err: 'samband-orsak' }, { text: fel2, err: 'samband-orsak' }]), visa: [top],
    los: `${ratt}. Därför ökar båda samtidigt – men den ena orsakar inte den andra.`,
    tips: 'Fundera på när båda linjerna har sin topp. Vad är det som händer då?',
  };
}

export function makeQ(spec: QuestionSpec, rng: Rng): DQ | null {
  const trapMode: Record<string, M> = { utsnitt: 'utsnitt', 'samband-orsak': 'samband', 'fa-svar': 'urval' };
  const mode: M = spec.mode === 'blandat' ? (spec.trap ? trapMode[spec.trap] : rng.pick(MODES)) : spec.mode as M;
  const level = spec.mode === 'blandat' ? Math.min(spec.level + rng.int(2), MAX[mode]) : Math.min(Math.max(0, spec.level), MAX[mode]);
  const b: Base = { mode, level, skill: `ma.stat.lura.${mode}` };
  switch (mode) {
    case 'rubrik': return rubrik(b, rng);
    case 'utsnitt': return utsnitt(b, rng, spec.trap);
    case 'summerad': return summerad(b, rng);
    case 'hundra': return hundra(b, rng);
    case 'urval': return urval(b, rng, spec.trap);
    case 'perperson': return perperson(b, rng);
    case 'samband': return samband(b, rng);
  }
}

export function specsForSkill(skill: string): QuestionSpec[] {
  const m = /^ma\.stat\.lura\.(.+)$/.exec(skill);
  const mode = MODES.find((x) => x === m?.[1]);
  return mode ? Array.from({ length: MAX[mode] + 1 }, (_, level) => ({ mode, level })) : [];
}
