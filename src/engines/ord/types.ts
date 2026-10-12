import type { ComponentType } from 'preact';
import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Lang } from '../../platform/speech';

// Ordmotorn: frågor där svaret är ord – välja rätt alternativ, skriva ett ord man hör,
// trycka på ett ord i en mening, eller lägga ordbitar i rätt ordning. Spelet levererar frågor, diagnos och förklaringar;
// motorn står för vyn (öppen → rätta → klar), tangentbordet, uppläsningen och fel som gäller alla spel.

/** val = välj (med en mening blir det en lucka), skriv = hör och skriv, markera = tryck på ett ord, ordna = bygg meningen. */
export type OrdKind = 'val' | 'skriv' | 'markera' | 'ordna';

/** Ett svarsalternativ. err = felkoden om barnet väljer det (saknas = rätt svar). label = det som står på knappen, om det ska vara något annat än text. */
export interface Alt {
  text: string;
  err?: string;
  label?: string;
  /** En bild i stället för text på knappen: en emoji eller en färg ('#e03131'). */
  pic?: string;
}

export interface OrdQ {
  mode: string;
  level: number;
  /** Permanent färdighets-id, t.ex. 'sv.stav.sj'. */
  skill: string;
  kind: OrdKind;
  /** Instruktionen, t.ex. "Lyssna och skriv ordet." */
  prompt: string;
  /** En mening där '___' är luckan (val och skriv). */
  sentence?: string;
  /** Rätt svar. */
  answer: string;
  /** Stor och liten bokstav räknas (annars spelar de ingen roll). */
  caseStrict?: boolean;
  /** Alternativen vid val (rätt + fel). Vid skriv: reserv om enheten saknar svensk röst. */
  alts?: Alt[];
  /** Det som läses upp (🔊). Vid skriv: diktatet (ordet, meningen, ordet). */
  say?: string;
  /** markera: meningens ord, vilka index som är rätt att trycka på, och felkoden för en miss. */
  tokens?: string[];
  targets?: number[];
  missTag?: string;
  /** markera: tecknet som visas efter rätt ord när frågan är klar (t.ex. ',' eller '.'). Utan det stryks ordet under som felstavat. */
  mark?: string;
  /** markera: felkoden för just det ordet (annars missTag). */
  misses?: Record<number, string>;
  /** ordna: bitarna i den ordning de visas (redan blandade). Svaret är bitarna i rätt ordning, med mellanslag emellan. */
  tiles?: string[];
  /** ordna: tecknet som står efter meningen ('.', '?' eller '!'). */
  end?: string;
  /** Fler svar som också är rätt (t.ex. en annan ordföljd som också fungerar). */
  answers?: string[];
  /** Skiljetecken räknas också (t.ex. när alternativen bara skiljer sig i punkt och komma). */
  exact?: boolean;
  /** Det som står i luckan när frågan är klar, om det inte ska vara svaret (t.ex. '?' när svaret är 'frågetecken'). */
  fill?: string;
  /** Språket som say läses upp på och som barnet skriver på (engelska: tangentbordet utan åäö). Saknas = svenska. */
  lang?: Lang;
  /** Hörfråga: say spelas upp direkt och står inte utskrivet. Saknas en röst för språket visas read (eller say) i stället. */
  listen?: boolean;
  /** Texten som visas vid en hörfråga när enheten inte kan läsa upp. */
  read?: string;
  /** En stor bild ovanför frågan: en emoji eller en färg ('#e03131'). */
  pic?: string;
  /** ordna och markera: bitarna är hela rader (steg i en instruktion, kodrader) och står under varandra. */
  lines?: boolean;
  /** Kod: raderna och alternativen skrivs med kodstil (och alternativ kan ha flera rader). */
  mono?: boolean;
}

export interface Explained { title: string; text: string }

export interface OrdGame<Q extends OrdQ = OrdQ> {
  id: string;
  make(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): Q;
  /** Felkod för ett skrivet svar, eller undefined om spelet inte känner igen felet. */
  diagnose(q: Q, given: string): string | undefined;
  /** Förklaringen vid fel. Får aldrig innehålla svaret – barnet ska rätta själv. */
  explain(tag: string, q: Q, given: string): Explained;
  /** Visas när frågan är klar (får visa svaret). */
  solution(q: Q): string;
  /** Ledtråden (kostar en av dagens ledtrådar). Avslöjar inte svaret. */
  hint(q: Q): string;
  /** markera: förklaringen när barnet tryckt på ord nummer i (annars en allmän "leta vidare"). */
  explainMiss?(q: Q, i: number, tag: string): Explained;
  specsForSkill(skill: string): QuestionSpec[];
  errLabels: Record<string, string>;
  /** En egen bild till frågan (t.ex. en klocka). done = frågan är klar. */
  Visual?: ComponentType<{ q: Q; done: boolean }>;
}
