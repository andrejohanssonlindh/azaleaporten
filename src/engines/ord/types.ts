import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';

// Ordmotorn: frågor där svaret är ord – välja rätt alternativ, skriva ett ord man hör,
// eller trycka på ett ord i en mening. Spelet levererar frågor, diagnos och förklaringar;
// motorn står för vyn (öppen → rätta → klar), tangentbordet, uppläsningen och fel som gäller alla spel.

export type OrdKind = 'val' | 'skriv' | 'markera';

/** Ett svarsalternativ. err = felkoden om barnet väljer det (saknas = rätt svar). */
export interface Alt { text: string; err?: string }

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
  specsForSkill(skill: string): QuestionSpec[];
  errLabels: Record<string, string>;
}
