import type { ComponentType } from 'preact';
import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';

// Drillmotorn: frågor där svaret är ett heltal som skrivs i en ruta i en uppställning,
// t.ex. "8 + 5 = ?" eller "7 · ? = 56". Spelet levererar generering, diagnos och förklaringar;
// motorn står för vyn (öppen → rätta → klar) och för fel som gäller alla spel.

/** En del av uppställningen: ett tal, ett tecken, eller null = rutan där barnet skriver svaret. */
export type Part = number | string | null;

export interface DrillQ {
  mode: string;
  level: number;
  /** Permanent färdighets-id, t.ex. 'ma.add.over-tio' eller 'ma.mult.7'. */
  skill: string;
  parts: Part[];
  answer: number;
}

export interface Explained { title: string; text: string }

export interface DrillGame<Q extends DrillQ = DrillQ> {
  id: string;
  make(spec: QuestionSpec, rng: Rng): Q;
  /** Felkod för ett fel svar, eller undefined om spelet inte känner igen felet. */
  diagnose(q: Q, given: number): string | undefined;
  explain(tag: string, q: Q, given: number): Explained;
  /** Visas när frågan är klar: hur man kan tänka. */
  solution(q: Q): string;
  /** Ledtråden (kostar en av dagens ledtrådar). */
  hint(q: Q): string;
  /** Bild som stöd, t.ex. tiorutor eller prickar. */
  Visual?: ComponentType<{ q: Q; hint: boolean; done: boolean }>;
  /** Etiketter för spelets felkoder (bossintro och statistik). */
  errLabels: Record<string, string>;
}
