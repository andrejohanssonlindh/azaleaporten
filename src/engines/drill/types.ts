import type { ComponentType } from 'preact';
import type { Rng } from '../../platform/rng';
import type { QuestionSpec } from '../../platform/rpg/types';

// Drillmotorn: frågor där svaret är ett heltal som skrivs i en ruta i en uppställning,
// t.ex. "8 + 5 = ?" eller "7 · ? = 56". Spelet levererar generering, diagnos och förklaringar;
// motorn står för vyn (öppen → rätta → klar) och för fel som gäller alla spel.

/** Ett bråk i uppställningen; null = rutan (täljare eller nämnare som ska fyllas i). */
export interface Frac { n: number | null; d: number | null }

/** En del av uppställningen: ett tal, ett tecken/en enhet, ett bråk, eller null = rutan där barnet svarar. */
export type Part = number | string | null | Frac;

export interface Choice { label: string; value: number }

export interface DrillQ {
  mode: string;
  level: number;
  /** Permanent färdighets-id, t.ex. 'ma.add.over-tio' eller 'ma.mult.7'. */
  skill: string;
  parts: Part[];
  answer: number;
  /** Text ovanför uppställningen, t.ex. en räknehändelse. */
  prompt?: string;
  /** Flerval i stället för att skriva: barnet trycker på ett alternativ (värdet jämförs med answer). */
  choices?: Choice[];
  /** Svaret kan vara negativt (ger en ±-knapp) eller ha decimaler (decimaltangentbord). */
  keypad?: 'int' | 'signed' | 'decimal';
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
  /** Frågeinställningar som brukar ge en viss färdighet. */
  specsForSkill(skill: string): QuestionSpec[];
  /** Etiketter för spelets felkoder (bossintro och statistik). */
  errLabels: Record<string, string>;
}
