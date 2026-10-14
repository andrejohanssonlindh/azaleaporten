import type { Rng } from '../../platform/rng';
import type { Lesson, QuestionCtx, QuestionSpec } from '../../platform/rpg/types';
import type { Chart } from './chart';

// Diagrammotorn: frågor om ett diagram. Läsa av ett värde, välja ett svar, trycka på en del av diagrammet,
// eller bygga diagrammet själv. Spelet levererar frågor, diagnos och förklaringar; motorn ritar diagrammen,
// står för vyn (öppen → rätta → klar) och rättar.

/**
 * las = läs av / räkna ut och skriv ett tal; val = välj bland alternativ; sant = Sant / Falskt / Går inte att veta;
 * tryck = tryck på en del av diagrammet (en stapel, en rad, en bit, axeln); bygg = bygg diagrammet (staplar,
 * streck eller punkter); laga = laga ett diagram som lurar (flytta axelns början, gör staplarna lika breda).
 */
export type DiagramKind = 'las' | 'val' | 'sant' | 'tryck' | 'bygg' | 'laga';

/** Ett svarsalternativ. err = felkoden om barnet väljer det (saknas = rätt svar). */
export interface Alt { text: string; err?: string }

/** En sak i en bild att räkna (x och y från 0 till 1). */
export interface Plock { ikon: string; x: number; y: number }

export interface DiagramQ {
  mode: string;
  level: number;
  /** Permanent färdighets-id, t.ex. 'ma.stat.stapel'. */
  skill: string;
  kind: DiagramKind;
  prompt: string;
  /** Diagrammet. Vid bygg: diagrammet som ska byggas (barnet ser det utan värden). */
  chart: Chart;
  /**
   * Rätt svar. las: talet; val och sant: alternativets text; tryck: delens id ('k2' = kategori 2, 'axel' = axelns tal);
   * bygg: värdena med komma emellan; laga: ett lagat läge ('a:0' eller 'b:1,1,1'; alla lägen som inte förvränger räknas).
   */
  answer: string;
  /** las: ordet efter rutan, t.ex. 'fåglar'. */
  enhet?: string;
  /** val och sant: alternativen (rätt + fel). */
  alts?: Alt[];
  /** tryck: delar som också är rätt, och felkoden för varje fel del. */
  targets?: string[];
  misses?: Record<string, string>;
  /** bygg: det barnet bygger från – en tabell, eller en bild med saker att räkna. */
  kalla?: Chart;
  bild?: Plock[];
  /** Kategorier som lyser när frågan är klar (det frågan handlade om). */
  visa?: number[];
  /** En tidningsrubrik över diagrammet (Skvallerpressen). */
  rubrik?: string;
  /** Kalla visas bredvid diagrammet (två diagram att jämföra), inte ovanför. */
  bredvid?: boolean;
  /** När frågan är klar visas diagrammet utan knep ("Visa sanningen"). */
  sanning?: boolean;
  /** laga: vad barnet lagar. */
  laga?: 'axel' | 'bredd';
}

export interface Explained { title: string; text: string }

export interface DiagramGame<Q extends DiagramQ = DiagramQ> {
  id: string;
  make(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): Q;
  /** Felkod för ett fel svar (talet, alternativet, delen eller de byggda värdena), eller undefined. */
  diagnose(q: Q, given: string): string | undefined;
  /** Förklaringen vid fel. Säger hur man gör, aldrig svaret. */
  explain(tag: string, q: Q, given: string): Explained;
  /** Visas när frågan är klar (får visa svaret). */
  solution(q: Q): string;
  /** Ledtråden (kostar en av dagens ledtrådar). Avslöjar inte svaret. */
  hint(q: Q): string;
  specsForSkill(skill: string): QuestionSpec[];
  errLabels: Record<string, string>;
  lessons?: Record<string, Lesson>;
}
