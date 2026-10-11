import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { heroKey } from '../profiles';
import { dayOf, daysBetween } from './skills';

// Veckans ord: skolans stavningsord, som en vuxen skriver in i Vuxenläge.
// Varje ord blir en egen färdighet ('sv.veckans.<ord>') i Stavningsträsket, så att gamla veckors
// ord kommer tillbaka som Glömskans dimma när de behöver repeteras.
// Listorna sparas bara på enheten (de kan innehålla namn).

export interface VeckansList { words: string[]; day: string }

export interface VeckansRecord { v: number; lists: VeckansList[] }

export const VECKANS: RecordSpec<VeckansRecord> = { version: 1, defaults: () => ({ v: 1, lists: [] }) };

export const VECKANS_AREA = 'stavningstrasket';
export const MAX_WORDS = 20;
const KEEP_LISTS = 12;
/** En lista räknas som veckans så här länge efter att den skrevs in. */
const CURRENT_DAYS = 7;

const key = (hid: string) => heroKey(hid, 'veckans');

export const veckansSkill = (word: string) => `sv.veckans.${word}`;
export const wordOfSkill = (skill: string) => (skill.startsWith('sv.veckans.') ? skill.slice('sv.veckans.'.length) : null);

/** Ord ur det en vuxen skrivit: ett per rad eller med komma emellan. Bara bokstäver, mellanslag och bindestreck. */
export function parseWords(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const w = raw.normalize('NFC').replace(/[^\p{L}\s-]/gu, '').trim().replace(/\s+/g, ' ');
    if (w && w.length <= 30 && !out.some((x) => x.toLocaleLowerCase('sv') === w.toLocaleLowerCase('sv'))) out.push(w);
  }
  return out.slice(0, MAX_WORDS);
}

export const getVeckansRecord = (hid: string) => loadRecord(key(hid), VECKANS).value;

/** Den senaste listan, om den skrevs in den senaste veckan. */
export function currentList(hid: string, day = dayOf()): VeckansList | null {
  const l = getVeckansRecord(hid).lists[0];
  return l && daysBetween(l.day, day) < CURRENT_DAYS ? l : null;
}

/** Sparar en ny lista. En lista från samma dag ersätts (rättelser); äldre listor sparas en tid. */
export function saveList(hid: string, words: string[], day = dayOf()) {
  const r = getVeckansRecord(hid);
  const rest = r.lists[0]?.day === day ? r.lists.slice(1) : r.lists;
  const lists = words.length ? [{ words, day }, ...rest] : rest;
  saveRecord(key(hid), VECKANS, { ...r, lists: lists.slice(0, KEEP_LISTS) });
}
