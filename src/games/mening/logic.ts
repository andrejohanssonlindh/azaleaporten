import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import { avoid, core, deckPick, norm } from '../../engines/ord/check';
import type { Alt, Explained, OrdQ } from '../../engines/ord/types';
import { ANFORING, BYGG, KOMMA, PAR, PUNKT, SAMBAND, TECKEN, type Komma, type Samband } from './meningar';

// Meningssmedjan: stor bokstav och punkt, var en mening slutar, punkt/frågetecken/utropstecken,
// bygga meningar (ordföljd), sambandsord, kommatecken och anföring.
// Färdighets-id:n ('sv.mening.<ämne>') och felkoder är permanenta.

export type Topic = 'punkt' | 'grans' | 'tecken' | 'ordfoljd' | 'samband' | 'komma' | 'anforing';

export interface MQ extends OrdQ {
  topic: Topic;
  /** Raden i innehållet. */
  row: number;
  /** Den rätt skrivna meningen (visas när frågan är klar). */
  right: string;
  rel?: Samband;
  komma?: Komma;
}

export const ERR: Record<string, string> = {
  'mening-stor': 'Liten bokstav i början av meningen',
  punkt: 'Glömmer punkten där meningen slutar',
  'stor-mitt': 'Stor bokstav mitt i meningen',
  'namn-liten': 'Liten bokstav på ett namn',
  fragetecken: 'Missar att meningen är en fråga',
  utropstecken: 'Missar att någon ropar eller känner något starkt',
  'onodigt-tecken': 'Frågetecken eller utropstecken där det ska vara punkt',
  ordfoljd: 'Orden i fel ordning',
  'rak-ordfoljd': 'Verbet står inte på andra plats',
  'fraga-ordfoljd': 'Blandar ihop fråga och påstående',
  samband: 'Sambandsord som inte passar',
  'komma-och': 'Komma före "och" i en uppräkning',
  komma: 'Komma på fel ställe',
  'anforing-tecken': 'Glömmer talstreck eller citattecken',
  'anforing-kolon': 'Glömmer kolon före citatet',
  'anforing-komma': 'Glömmer komma efter repliken',
};

/** Felkoder som en boss kan sikta på, och frågetyperna som kan ge dem. */
const TRAP_TOPICS: Record<string, Topic[]> = { punkt: ['punkt', 'grans'], 'komma-och': ['komma'] };

const SKILL: Record<Topic, string> = { punkt: 'punkt', grans: 'grans', tecken: 'tecken', ordfoljd: 'ordfoljd', samband: 'samband', komma: 'komma', anforing: 'anforing' };

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv') + s.slice(1);
const low = (s: string) => s.charAt(0).toLocaleLowerCase('sv') + s.slice(1);
const isCap = (s: string) => s.charAt(0) !== s.charAt(0).toLocaleLowerCase('sv');

/* ---------- vilka frågor ett läge har ---------- */

const band = (t: Topic, i: number): 1 | 2 =>
  t === 'tecken' ? TECKEN[i][2] : t === 'ordfoljd' ? BYGG[i][2] : t === 'samband' ? SAMBAND[i][4] : t === 'komma' ? KOMMA[i][2] : 1;

const size: Record<Topic, number> = {
  punkt: PUNKT.length, grans: PAR.length, tecken: TECKEN.length, ordfoljd: BYGG.length, samband: SAMBAND.length, komma: KOMMA.length, anforing: ANFORING.length,
};

function topicsFor(mode: string, level: number): Topic[] {
  switch (mode) {
    case 'punkt': return [level === 0 ? 'punkt' : 'grans'];
    case 'tecken': case 'ordfoljd': case 'samband': case 'komma': case 'anforing': return [mode];
    default: // blandat
      return level === 0 ? ['punkt', 'tecken', 'ordfoljd', 'samband']
        : level === 1 ? ['grans', 'tecken', 'ordfoljd', 'samband', 'komma']
          : ['grans', 'tecken', 'ordfoljd', 'samband', 'komma', 'anforing'];
  }
}

interface Item { t: Topic; i: number }

export function items(mode: string, level: number, trap?: string): Item[] {
  const of = (ts: Topic[]) => ts.flatMap((t) => Array.from({ length: size[t] }, (_, i) => ({ t, i })).filter(({ t, i }) => level > 0 || band(t, i) === 1));
  let all = of(topicsFor(mode, level));
  if (trap && TRAP_TOPICS[trap]) {
    const hit = all.filter((x) => TRAP_TOPICS[trap].includes(x.t));
    all = hit.length ? hit : of(TRAP_TOPICS[trap]);
    // Kommakatten: bara uppräkningar, där kommat före "och" är en fälla.
    if (trap === 'komma-och') all = all.filter((x) => x.t !== 'komma' || KOMMA[x.i][1] === 'lista');
  }
  return all;
}

/* ---------- stor bokstav och punkt ---------- */

/** Namnen i meningarna (de enda orden med stor bokstav mitt i en mening). */
export const NAMN = new Set(['Maja', 'Ali', 'Sara', 'Lisa', 'Bamse', 'Sixten', 'Lund', 'Göteborg', 'Malmö']);

/** Ord nummer i (från 0) är ett namn: stor bokstav mitt i meningen. */
const nameAt = (words: string[], i: number) => i > 0 && isCap(words[i]);

export function punktVariants(right: string): Alt[] {
  const words = right.slice(0, -1).split(' ');
  const out: Alt[] = [{ text: low(right), err: 'mening-stor' }, { text: right.slice(0, -1), err: 'punkt' }];
  const plain = words.map((_, i) => i).filter((i) => i > 0 && !isCap(words[i]) && words[i].length > 2);
  if (plain.length) {
    const i = plain.at(-1)!;
    out.push({ text: `${words.map((w, k) => (k === i ? cap(w) : w)).join(' ')}.`, err: 'stor-mitt' });
  }
  const names = words.map((_, i) => i).filter((i) => nameAt(words, i));
  if (names.length) {
    const i = names[0];
    out.push({ text: `${words.map((w, k) => (k === i ? low(w) : w)).join(' ')}.`, err: 'namn-liten' });
  }
  return out;
}

/** Svaret plus två fel; fällan (om den finns bland felen) alltid med. */
function choose(rng: Rng, right: string, wrong: Alt[], trap?: string, n = 2): Alt[] {
  const first = wrong.filter((a) => a.err === trap);
  const rest = rng.shuffle(wrong.filter((a) => a.err !== trap));
  return rng.shuffle([{ text: right }, ...[...first, ...rest].slice(0, n)]);
}

type Built = Omit<MQ, 'mode' | 'level' | 'skill' | 'topic' | 'row'>;

function punktQ(i: number, rng: Rng, trap?: string): Built {
  const right = PUNKT[i];
  return { kind: 'val', exact: true, prompt: 'Vilken mening är rätt skriven?', answer: right, right, alts: choose(rng, right, punktVariants(right), trap) };
}

/** Två meningar ihopskrivna, utan punkt och utan stor bokstav i början av den andra. */
export function gransTokens(i: number): { tokens: string[]; target: number } {
  const [a, b] = PAR[i];
  const wa = a.slice(0, -1).split(' ');
  const wb = b.slice(0, -1).split(' ');
  const first = NAMN.has(wb[0]) ? wb[0] : low(wb[0]);
  return { tokens: [...wa, first, ...wb.slice(1)], target: wa.length - 1 };
}

function gransQ(i: number): Built {
  const { tokens, target } = gransTokens(i);
  const prompt = 'Här har två meningar skrivits ihop. Tryck på ordet där den första meningen slutar.';
  return { kind: 'markera', prompt, tokens, targets: [target], mark: '.', missTag: 'punkt', answer: tokens[target], right: PAR[i].join(' '), say: prompt };
}

/* ---------- punkt, frågetecken eller utropstecken ---------- */

const MARKS = { '.': 'punkt', '?': 'frågetecken', '!': 'utropstecken' } as const;
const MARK_ERR = { '.': 'onodigt-tecken', '?': 'fragetecken', '!': 'utropstecken' } as const;

function teckenQ(i: number): Built {
  const [text, mark] = TECKEN[i];
  const alts = (['.', '?', '!'] as const).map((m) => ({ text: MARKS[m], label: `${m}  ${MARKS[m]}`, ...(m === mark ? {} : { err: MARK_ERR[mark] }) }));
  return {
    kind: 'val', prompt: 'Vilket tecken ska stå sist?', sentence: `${text}___`, answer: MARKS[mark], fill: mark, alts, right: `${text}${mark}`,
    say: `${text}.`,
  };
}

/* ---------- bygg meningen ---------- */

interface Chunk { role: string; text: string }

export const chunksOf = (i: number): Chunk[] => BYGG[i][0].split('|').map((c) => { const [role, text] = c.split(':'); return { role, text }; });

function perms<T>(a: T[]): T[][] {
  if (a.length <= 1) return [a];
  return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
}

/**
 * Alla ordningar som är rätt: verbet på andra plats i ett påstående (vem som helst av S, O och A kan stå först),
 * frågeordet först och sedan verbet i en frågeordsfråga, och verbet först i en ja/nej-fråga.
 * Bitarna i slutet (var/när) får byta plats med varandra.
 */
export function orders(i: number): string[] {
  const cs = chunksOf(i);
  const end = BYGG[i][1];
  const by = (r: string) => cs.filter((c) => c.role === r);
  const V = by('V')[0], S = by('S')[0], Q = by('Q')[0];
  const N = by('N');
  const mid = cs.filter((c) => c.role === 'M' || c.role === 'O');
  const As = by('A');
  const tail = (skip?: Chunk) => perms(As.filter((a) => a !== skip)).map((p) => [...mid.filter((m) => m !== skip), ...p]);
  let out: Chunk[][];
  if (Q) out = tail().map((t) => [Q, V, ...(S ? [S] : []), ...N, ...t]);
  else if (end === '?') out = tail().map((t) => [V, S, ...N, ...t]);
  else {
    const fronts = [S, ...mid.filter((m) => m.role === 'O'), ...As];
    out = fronts.flatMap((f) => tail(f).map((t) => [f, V, ...(f === S ? [] : [S]), ...N, ...t]));
  }
  const seen = new Set<string>();
  return out.map((o) => o.map((c) => c.text).join(' ')).filter((s) => (seen.has(s) ? false : (seen.add(s), true)));
}

function ordfoljdQ(i: number, rng: Rng): Built {
  const cs = chunksOf(i);
  const end = BYGG[i][1];
  const answer = cs.map((c) => c.text).join(' ');
  const ok = orders(i);
  let tiles = rng.shuffle(cs.map((c) => c.text));
  for (let k = 0; k < 20 && ok.includes(tiles.join(' ')); k++) tiles = rng.shuffle(tiles);
  return {
    kind: 'ordna', prompt: end === '?' ? 'Bygg en fråga av bitarna.' : 'Bygg en mening av bitarna.', tiles, end,
    answer, answers: ok.filter((o) => o !== answer), right: `${cap(answer)}${end}`, say: end === '?' ? 'Bygg en fråga av bitarna.' : 'Bygg en mening av bitarna.',
  };
}

/** Varför ordningen inte stämmer: verbet först (en fråga), verbet efter vem (rak ordföljd) eller något annat. */
export function diagnoseOrder(i: number, given: string): string {
  const cs = chunksOf(i);
  const end = BYGG[i][1];
  // Bitarna i den ordning barnet lade dem (en bit kan innehålla flera ord).
  const placed: Chunk[] = [];
  let rest = norm(given).toLocaleLowerCase('sv');
  while (rest) {
    const c = cs.filter((x) => !placed.includes(x) && (rest === x.text || rest.startsWith(`${x.text} `))).sort((a, b) => b.text.length - a.text.length)[0];
    if (!c) return 'ordfoljd';
    placed.push(c);
    rest = rest.slice(c.text.length).trimStart();
  }
  const roles = placed.map((c) => c.role);
  const vAt = roles.indexOf('V');
  if (end === '.') {
    if (vAt === 0) return 'fraga-ordfoljd';
    if (vAt > 1 && roles[0] !== 'S' && roles[1] === 'S') return 'rak-ordfoljd';
    return 'ordfoljd';
  }
  if (roles[0] === 'S') return 'fraga-ordfoljd';
  if (roles[0] === 'Q' && vAt > 1) return 'rak-ordfoljd';
  return 'ordfoljd';
}

/* ---------- sambandsord ---------- */

function sambandQ(i: number, rng: Rng): Built {
  const [sentence, right, wrong, rel] = SAMBAND[i];
  const alts = rng.shuffle([{ text: right }, ...wrong.map((text) => ({ text, err: 'samband' }))]);
  return { kind: 'val', prompt: 'Vilket ord passar i luckan?', sentence, answer: right, alts, rel, right: sentence.replace('___', right), say: sentence.replace('___', '…') };
}

/* ---------- kommatecken ---------- */

export function kommaTokens(i: number): { tokens: string[]; target: number; och?: number } {
  const [sentence] = KOMMA[i];
  const words = sentence.split(' ');
  const target = words.findIndex((w) => w.endsWith(','));
  const tokens = words.map((w) => w.replace(/,$/, ''));
  const och = KOMMA[i][1] === 'lista' ? tokens.indexOf('och') - 1 : -1;
  return { tokens, target, och: och >= 0 ? och : undefined };
}

function kommaQ(i: number): Built {
  const { tokens, target, och } = kommaTokens(i);
  const prompt = 'Ett komma fattas. Tryck på ordet som ska ha ett komma efter sig.';
  return {
    kind: 'markera', prompt, tokens, targets: [target], mark: ',', missTag: 'komma', misses: och !== undefined ? { [och]: 'komma-och' } : undefined,
    answer: core(tokens[target]), right: KOMMA[i][0], komma: KOMMA[i][1], say: prompt,
  };
}

/* ---------- anföring ---------- */

export function anforingAlts(i: number, style: 'streck' | 'citat'): { right: string; wrong: Alt[] } {
  const [who, verb, quote, mark] = ANFORING[i];
  if (style === 'streck') {
    const replik = `${quote}${mark === '.' ? ',' : mark}`;
    return {
      right: `– ${replik} ${verb} ${who}.`,
      wrong: [
        { text: `${replik} ${verb} ${who}.`, err: 'anforing-tecken' },
        ...(mark === '.' ? [{ text: `– ${quote} ${verb} ${who}.`, err: 'anforing-komma' }] : []),
      ],
    };
  }
  const head = `${cap(who)} ${verb}`;
  return {
    right: `${head}: ”${quote}${mark}”`,
    wrong: [{ text: `${head} ”${quote}${mark}”`, err: 'anforing-kolon' }, { text: `${head}: ${quote}${mark}`, err: 'anforing-tecken' }],
  };
}

function anforingQ(i: number, rng: Rng): Built {
  // Talstreck när repliken slutar med punkt (då behövs kommat), annars kolon och citattecken.
  const style = ANFORING[i][3] === '.' && rng.next() < 0.5 ? 'streck' : 'citat';
  const { right, wrong } = anforingAlts(i, style);
  return { kind: 'val', exact: true, prompt: 'Någon säger något. Vilken mening är rätt skriven?', answer: right, right, alts: rng.shuffle([{ text: right }, ...wrong]) };
}

/* ---------- frågefabriken ---------- */

export function build(t: Topic, i: number, rng: Rng, trap?: string): Built {
  switch (t) {
    case 'punkt': return punktQ(i, rng, trap);
    case 'grans': return gransQ(i);
    case 'tecken': return teckenQ(i);
    case 'ordfoljd': return ordfoljdQ(i, rng);
    case 'samband': return sambandQ(i, rng);
    case 'komma': return kommaQ(i);
    case 'anforing': return anforingQ(i, rng);
  }
}

export function makeQ(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): MQ {
  const level = Math.max(0, Math.min(2, spec.level));
  const pool = items(spec.mode, level, spec.trap);
  const { t, i } = deckPick(pool, rng, ctx, `${spec.mode}/${level}/${spec.trap ?? ''}`);
  return { mode: spec.mode, level, skill: `sv.mening.${SKILL[t]}`, topic: t, row: i, ...build(t, i, rng, spec.trap) };
}

export function specsForSkill(skill: string): QuestionSpec[] {
  switch (skill) {
    case 'sv.mening.punkt': return [{ mode: 'punkt', level: 0 }];
    case 'sv.mening.grans': return [{ mode: 'punkt', level: 1 }];
    case 'sv.mening.tecken': return [{ mode: 'tecken', level: 0 }, { mode: 'tecken', level: 1 }];
    case 'sv.mening.ordfoljd': return [{ mode: 'ordfoljd', level: 0 }, { mode: 'ordfoljd', level: 1 }];
    case 'sv.mening.samband': return [{ mode: 'samband', level: 0 }, { mode: 'samband', level: 1 }];
    case 'sv.mening.komma': return [{ mode: 'komma', level: 0 }, { mode: 'komma', level: 1 }];
    case 'sv.mening.anforing': return [{ mode: 'anforing', level: 0 }];
    default: return [];
  }
}

export function diagnose(q: MQ, given: string): string | undefined {
  return q.topic === 'ordfoljd' ? diagnoseOrder(q.row, given) : undefined;
}

/* ---------- förklaringar (avslöjar aldrig svaret) ---------- */

// Sambandsordens förklaringar undviker själva sambandsorden (och, men, så, för, när, om …) – de är ju svar.
const SAMBAND_TEXT: Record<Samband, string> = {
  motsats: 'Den andra delen säger emot den första – det blev inte som man kunde tro. Vilket ord visar det?',
  val: 'Här finns två saker att välja mellan. Vilket ord visar det?',
  foljd: 'Den andra delen berättar vad som hände på grund av den första. Vilket ord visar det?',
  orsak: 'Den andra delen förklarar varför. Vilket ord visar en orsak?',
  tid: 'Orden handlar om tid – vad som händer först, sist eller samtidigt. Vilket ord passar då?',
  villkor: 'Det ena händer bara ifall det andra stämmer. Vilket ord visar det?',
  tillagg: 'Här läggs en sak till en annan. Vilket ord binder ihop dem?',
};

const KOMMA_TEXT: Record<Komma, string> = {
  lista: 'I en uppräkning står kommat mellan sakerna som räknas upp. Leta upp sakerna.',
  bisats: 'Meningen börjar med en bisats – en del som inte kan stå ensam. Kommat sätts där den delen tar slut.',
  tilltal: 'Meningen börjar med ett litet ord eller ett namn på den man pratar med. Kommat kommer direkt efter det.',
  men: 'Före ett ord som visar en motsats brukar det stå ett komma.',
};

export function explain(tag: string, q: MQ): Explained {
  switch (tag) {
    case 'mening-stor': return { title: 'Stor bokstav först', text: 'En mening börjar alltid med stor bokstav. Titta på första bokstaven.' };
    case 'punkt':
      return q.topic === 'grans'
        ? { title: 'Leta efter slutet', text: 'Läs långsamt från början. Var tar den första tanken slut? Där ska punkten stå. Nästa mening börjar efter den.' }
        : { title: 'Var slutar meningen?', text: 'En mening som berättar något slutar med ett tecken. Titta noga på slutet av meningen.' };
    case 'stor-mitt': return { title: 'Stor bokstav mitt i meningen', text: 'Mitt i en mening har bara namn stor bokstav – på personer, djur, platser. Vanliga ord skrivs med liten bokstav.' };
    case 'namn-liten': return { title: 'Namn har stor bokstav', text: 'Namn på personer, djur, platser börjar alltid med stor bokstav – också mitt i en mening.' };
    case 'fragetecken': return { title: 'Läs meningen igen', text: 'Frågar meningen efter något? Då vill den ha ett svar. Prova: kan man svara på den?' };
    case 'utropstecken': return { title: 'Läs meningen igen', text: 'Ropar någon? Känner någon något starkt – ont, glädje, rädsla? Säg meningen högt med känsla.' };
    case 'onodigt-tecken': return { title: 'Läs meningen igen', text: 'Berättar meningen bara något, helt lugnt? Ett frågeord betyder inte alltid att någon frågar. Kan man svara på meningen?' };
    case 'ordfoljd': return { title: 'Läs din mening högt', text: 'Låter den som svenska? Börja med vem som gör något. Vad gör den? Flytta bitarna, prova igen.' };
    case 'rak-ordfoljd': return { title: 'Verbet på andra plats', text: 'I svenska står verbet – det som händer – på andra plats. Börjar meningen med något annat än vem som gör det, kommer verbet direkt efter: "Nu springer vi", inte "Nu vi springer".' };
    case 'fraga-ordfoljd':
      return q.end === '?'
        ? { title: 'Det ska bli en fråga', text: 'I en fråga kommer verbet tidigt, före den som gör något: "Springer du?" Prova att flytta bitarna.' }
        : { title: 'Det blev en fråga', text: 'Står verbet först blir det en fråga: "Springer du?" Här ska meningen i stället berätta något.' };
    case 'samband': return { title: 'Hur hänger delarna ihop?', text: SAMBAND_TEXT[q.rel ?? 'tillagg'] };
    case 'komma-och': return { title: 'Inget komma före "och"', text: 'I en uppräkning står kommat mellan sakerna – men inte före det sista "och". Där räcker ordet.' };
    case 'komma': return { title: 'Inte där', text: KOMMA_TEXT[q.komma ?? 'lista'] };
    case 'anforing-tecken': return { title: 'Visa att någon pratar', text: 'Läsaren måste se vilka ord någon säger. Det visas med ett talstreck först, eller med citattecken runt orden.' };
    case 'anforing-kolon': return { title: 'Något fattas före citatet', text: 'När det först står vem som pratar ("Hon sa"), kommer ett kolon före citattecknen.' };
    case 'anforing-komma': return { title: 'Något fattas efter repliken', text: 'Slutar repliken med punkt, byts punkten mot ett komma – sedan kommer vem som sa det.' };
    default: return { title: 'Inte riktigt', text: hint(q) };
  }
}

export function explainMiss(q: MQ, _i: number, tag: string): Explained {
  return explain(tag, q);
}

export function hint(q: MQ): string {
  switch (q.topic) {
    case 'punkt': return 'En mening börjar med stor bokstav och slutar med ett tecken. Bara namn har stor bokstav mitt i.';
    case 'grans': return 'Läs långsamt. Var tar den första tanken slut?';
    case 'tecken': return 'Läs meningen högt. Berättar den något, frågar den något eller ropar den?';
    case 'ordfoljd': return q.end === '?' ? 'I en fråga kommer verbet tidigt.' : 'Vem gör något? Vad gör den? Verbet står på andra plats.';
    case 'samband': return avoid(q.answer, 'Läs meningen med varje ord. Vilket gör att delarna hänger ihop?', 'Prova varje ord i luckan. Vilket låter rätt?');
    case 'komma': return KOMMA_TEXT[q.komma ?? 'lista'];
    case 'anforing': return 'Kolla tecknen: talstreck eller citattecken, kolon och komma.';
  }
}

const WHY = { '.': 'den berättar något', '?': 'det är en fråga', '!': 'någon ropar eller känner något starkt' };
const REL_NAME: Record<Samband, string> = {
  motsats: 'en motsats', val: 'ett val mellan två saker', foljd: 'vad som hände sedan', orsak: 'en orsak', tid: 'när något händer', villkor: 'ett villkor', tillagg: 'att något läggs till',
};

export function solution(q: MQ): string {
  switch (q.topic) {
    case 'tecken': return `${q.right} Tecknet är ${q.answer}, för att ${WHY[q.fill as '.' | '?' | '!']}.`;
    case 'samband': return `${q.right} "${q.answer}" visar ${REL_NAME[q.rel!]}.`;
    case 'ordfoljd': return q.answers?.length ? `${q.right} Det finns fler ordningar som också är rätt.` : q.right;
    case 'grans': return `Punkten ska stå efter "${q.answer}": ${q.right}`;
    case 'komma': return `Kommat ska stå efter "${q.answer}": ${q.right}`;
    default: return `Rätt skrivet: ${q.right}`;
  }
}
