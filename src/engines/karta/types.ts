import type { Rng } from '../../platform/rng';
import type { Lesson, QuestionCtx, QuestionSpec } from '../../platform/rpg/types';

// Kartmotorn: frågor om en karta. Peka ut en plats, välja ett namn, skriva ett namn eller räkna med skalan.
// Spelet bygger kartan (ren data) och frågan; motorn ritar kartan, står för vyn (öppen → rätta → klar) och rättar.

/** val = välj bland alternativ; peka = tryck på en plats på kartan och sedan Svara; skriv = skriv ett namn; tal = skriv ett tal. */
export type KartaKind = 'val' | 'peka' | 'skriv' | 'tal';

/** En yta på kartan: ett land, en världsdel, ett hav, en sjö eller en ö. d = SVG-väg. */
export interface Yta {
  id: string;
  d: string;
  typ: 'land' | 'bakland' | 'hav' | 'sjo' | 'hojd-lag' | 'hojd-mellan' | 'hojd-hog' | 'skog' | 'aker';
  /** Namnet (visas bara när frågan är klar). */
  namn?: string;
  /** Var namnet skrivs. */
  lx?: number;
  ly?: number;
  /** Går att trycka på. */
  tap?: boolean;
}

/** En linje: en älv, en väg eller en järnväg. */
export interface Linje { id: string; d: string; typ: 'alv' | 'vag' | 'jarnvag' | 'grans'; namn?: string; lx?: number; ly?: number; tap?: boolean }

/** En prick: ett land (i en vy där länderna är små), en stad eller ett berg. */
export interface Prick {
  id: string;
  x: number;
  y: number;
  namn?: string;
  /** Bild i stället för prick (Kartrummets platser). */
  ikon?: string;
  /** Huvudstad (fyrkantig prick). */
  stor?: boolean;
  /** Träffytans radie (räknas ut så att grannarna inte överlappar). */
  hit?: number;
  tap?: boolean;
}

export interface Etikett { x: number; y: number; text: string; liten?: boolean }

/** Kompassrosen. vrid = vart norr pekar (grader medurs från uppåt). pil = väderstrecket som lyser. alla = skriv ut alla bokstäver. */
export interface Ros { x: number; y: number; r: number; vrid?: number; pil?: string; alla?: boolean }

/** En karta, färdig att rita. Koordinaterna är i kartans egna enheter (viewBox 0 0 w h). */
export interface Karta {
  w: number;
  h: number;
  /** Rita havet som bakgrund (annars papper). */
  hav: boolean;
  ytor: Yta[];
  linjer?: Linje[];
  prickar?: Prick[];
  etiketter?: Etikett[];
  ros?: Ros;
  /** Ekvatorn (y-värdet) ritas som en streckad linje. */
  ekvator?: number;
  /** Skalstock: px = längden på kartan, text = vad den motsvarar. */
  skala?: { x: number; y: number; px: number; text: string };
  /** Kartans namn (för skärmläsare). */
  titel: string;
}

/** Ett svarsalternativ. err = felkoden om barnet väljer det (saknas = rätt svar). flagga = visa en flagga i stället för text. */
export interface Alt { text: string; err?: string; flagga?: string }

export interface KartaQ {
  mode: string;
  level: number;
  /** Permanent färdighets-id, t.ex. 'geo.land.europa'. */
  skill: string;
  kind: KartaKind;
  prompt: string;
  karta?: Karta;
  /** Platser som är markerade i frågan (det som frågas om). */
  lyser?: string[];
  /** Platser som visas med namn när frågan är klar. */
  visa?: string[];
  /** En flagga som frågans bild. */
  flagga?: string;
  /** En stor bild (emoji) i frågan. */
  pic?: string;
  /** Rätt svar. val: alternativets text; peka: platsens id; skriv: namnet; tal: talet. */
  answer: string;
  /** skriv: andra godkända namn (Peking/Beijing). peka: andra platser som också är rätt. */
  answers?: string[];
  alts?: Alt[];
  /** peka: felkoden för varje fel plats. */
  misses?: Record<string, string>;
  /** skriv och tal: typiska felsvar (normaliserade) och deras felkod. */
  cand?: Record<string, string>;
  /** tal: ordet efter rutan, t.ex. 'km'. */
  enhet?: string;
  /** Hur man tänker (visas när frågan är klar; får innehålla svaret). */
  los: string;
  /** Ledtråden (aldrig svaret). */
  tips: string;
}

export interface Explained { title: string; text: string }

export interface KartaGame<Q extends KartaQ = KartaQ> {
  id: string;
  make(spec: QuestionSpec, rng: Rng, ctx?: QuestionCtx): Q;
  /** Förklaringen vid fel. Säger hur man tänker, aldrig svaret. */
  explain(tag: string, q: Q, given: string): Explained;
  specsForSkill(skill: string): QuestionSpec[];
  errLabels: Record<string, string>;
  lessons?: Record<string, Lesson>;
}
