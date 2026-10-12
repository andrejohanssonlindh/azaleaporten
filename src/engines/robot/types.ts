import type { Rng } from '../../platform/rng';
import type { QuestionCtx, QuestionSpec } from '../../platform/rpg/types';

// Robotmotorn: en robot på ett rutnät som gör exakt det programmet säger. Spelen levererar världar och program;
// motorn kör programmen, rättar genom att köra dem, hittar felet (genom att prova små ändringar) och står för vyn.

/** 0 = upp, 1 = höger, 2 = ner, 3 = vänster. */
export type Dir = 0 | 1 | 2 | 3;
export type Pos = [number, number];

/** Pilar (flyttar ett steg åt det hållet, oavsett vart roboten tittar): upp, höger, ner, vänster. */
export type Arrow = 'U' | 'R' | 'D' | 'L';
/** Svängar (utgår från roboten): framåt, sväng vänster, sväng höger. */
export type Turn = 'F' | 'V' | 'H';
export type Atom = Arrow | Turn;
export interface Loop { rep: number; body: Cmd[] }
export type Cmd = Atom | Loop;
export type Prog = Cmd[];

/** pilar = ↑ → ↓ ←; svang = framåt och svängar. */
export type Palette = 'pilar' | 'svang';

export interface World {
  w: number;
  h: number;
  start: Pos;
  dir: Dir;
  /** Batteriet som roboten ska fram till. Saknas i vart-frågor (då vore svaret avslöjat). */
  goal?: Pos;
  rocks: Pos[];
  /** Diamanter som ska plockas på vägen. */
  gems: Pos[];
}

/** bygg = bygg programmet själv; vart = var hamnar roboten?; bugg = tryck på blocket som är fel; lucka = välj det som fattas. */
export type RobotKind = 'bygg' | 'vart' | 'bugg' | 'lucka';

/** Ett alternativ i en vart-fråga: en ruta (bokstav A–D i ordning). err saknas = rätt. */
export interface Spot { at: Pos; err?: string }
/** Ett alternativ i en lucka: ett block eller ett antal varv. */
export interface Fill { fill: Atom | number; err?: string }

export interface RobotQ {
  mode: string;
  level: number;
  /** Permanent färdighets-id, t.ex. 'prog.kod.pilar'. */
  skill: string;
  kind: RobotKind;
  prompt: string;
  world: World;
  palette: Palette;
  /** bygg: loopblocket finns i paletten. */
  loops?: boolean;
  /** bygg: högst så här många block (då behövs en loop). */
  maxBlocks?: number;
  /** vart, bugg och lucka: programmet som visas (vid lucka står hålet på platsen hole). */
  prog?: Prog;
  /** bygg: en lösning (visas efter tre försök); bugg: det rättade programmet. */
  solution?: Prog;
  /** vart: rutorna A–D. */
  spots?: Spot[];
  /** bugg: block-id:n där en enda ändring räcker (alla räknas som rätt). */
  targets?: string[];
  /** lucka: hålets block-id, och alternativen. */
  hole?: string;
  fills?: Fill[];
}

export interface Explained { title: string; text: string }

export interface RobotGame<Q extends RobotQ = RobotQ> {
  id: string;
  make(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): Q;
  /** Ledtråden (avslöjar inte svaret). Saknas den används motorns. */
  hint?(q: Q): string;
  specsForSkill(skill: string): QuestionSpec[];
  /** Spelets egna felkoder (motorns finns i ROBOT_ERR). */
  errLabels?: Record<string, string>;
}
