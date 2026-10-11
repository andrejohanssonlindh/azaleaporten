import type { ComponentType } from 'preact';
import type { Rng } from '../rng';

// Plattformens äventyrsmodell: ett område (t.ex. Tidstornet) består av epoker med banor och bossar.
// Spelen levererar bara frågor; rundor, bossar, belöningar och loggning ägs av plattformen.
// Alla id:n här är permanenta.

/** Bossens fas 2 ber om level + 1; spelet klampar själv till sin högsta nivå. */
export interface QuestionSpec { mode: string; level: number; trap?: string }

export interface StageDef {
  type: 'stage';
  id: string;
  name: string;
  icon: string;
  desc: string;
  spec: QuestionSpec;
  /** Snittid (ms) under vilken tio rätt ger tredje stjärnan. */
  thrMs: number;
}

export interface BossLines {
  entrance: string;
  phase2?: string;
  onHeroMiss?: string[];
  onBossHit?: string[];
  defeat: string;
}

export interface BossDef {
  type: 'boss';
  id: string;
  /** monster = missuppfattning som tämjs och blir husdjur; mastare = lärar-boss (persona kan bytas av familjepaketet). */
  kind: 'monster' | 'mastare';
  name: string;
  icon: string;
  title: string;
  /** Antal rätta svar som krävs. Utrustning får aldrig sänka detta under 10 för mästare (lärandets integritet). */
  hp: number;
  /** Felkod som bossen riktar in sig på (varannan fråga). */
  trap?: string;
  pool: QuestionSpec[];
  lines: BossLines;
  pet?: { name: string; icon: string };
  titleReward: string;
}

export type PathNode = StageDef | BossDef;

export interface EraDef {
  id: string;
  name: string;
  icon: string;
  fact: string;
  nodes: PathNode[];
}

export interface AreaDef {
  areaId: string;
  gameId: string;
  title: string;
  /** Kunskapen på hjältebladet som området tränar. */
  kunskap: { name: string; icon: string };
  story: string;
  /** Ord på resultatskärmen, i områdets tema. */
  texts: { cleared: string; notYet: string; back: string };
  eras: EraDef[];
}

export interface FirstAnswer { correct: boolean; ms: number; errTag?: string; hint: boolean }

export interface QuestionViewProps {
  q: unknown;
  hint: boolean;
  /** Anropas en gång, vid första svaret (bara det räknas). */
  onAnswer(r: FirstAnswer): void;
  /** Anropas när frågan är klar (rättad) och barnet trycker Nästa. */
  onDone(fixed?: 'self' | 'shown'): void;
  nextLabel?: string;
}

export interface GameModule {
  id: string;
  makeQuestion(spec: QuestionSpec, rng: Rng): unknown;
  skillOf(q: unknown): string;
  /** Frågeinställningar som brukar ge en viss färdighet (för repetition av just den). */
  specsForSkill(skill: string): QuestionSpec[];
  /** Kort beskrivning av en felkod (bossintro, statistik). */
  errLabel(tag: string): string | undefined;
  View: ComponentType<QuestionViewProps>;
}

export const allNodes = (a: AreaDef): PathNode[] => a.eras.flatMap((e) => e.nodes);
