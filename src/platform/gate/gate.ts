import { loadRecord, saveRecord, type RecordSpec } from '../storage/record';
import { decryptWithKey, fromB64, isEncryptedPack, toB64, unlockPack, type EncryptedPack } from './crypto';

// Porten: startskärmen. Finns ett krypterat familjepaket (public/packs/familj.enc) krävs lösenordet
// för att låsa upp lärar-bossarna. Nyckeln sparas på enheten så lösenordet bara behövs en gång.
// Utan lösenord fungerar allt, men med allmänna boss-personor.

/** En boss-persona. Mekaniken (fällor, HP, faser) ligger i spelets publika data; personan är bara utseende och repliker. */
export interface Persona {
  boss: string;
  name: string;
  title: string;
  portrait?: string;
  color?: string;
  grades?: [number, number];
  entrance: string;
  phase2?: string;
  phase3?: string;
  onHeroMiss?: string[];
  onBossHit?: string[];
  defeat: string;
  signatureItem?: { name: string; slot: string; flavor: string };
}

export interface FamilyPack {
  format: 'azaleaporten-familjepaket';
  v: 1;
  personas: Persona[];
}

export interface GateState {
  v: number;
  opened: boolean;
  mode: 'family' | 'public';
  salt: string | null;
  key: string | null;
}

const GATE: RecordSpec<GateState> = {
  version: 1,
  defaults: () => ({ v: 1, opened: false, mode: 'public', salt: null, key: null }),
};

export interface GateStatus {
  state: GateState;
  /** Det finns ett familjepaket publicerat. */
  packAvailable: boolean;
  /** Upplåst paket, eller null. */
  pack: FamilyPack | null;
  /** Paket finns men enheten är inte upplåst (eller lösenordet har bytts). */
  needsPassword: boolean;
}

let encrypted: EncryptedPack | null = null;

const packUrl = () => `${import.meta.env.BASE_URL}packs/familj.enc`;

async function fetchPack(): Promise<EncryptedPack | null> {
  try {
    const res = await fetch(packUrl(), { cache: 'no-cache' });
    if (!res.ok) return null;
    const json = await res.json();
    return isEncryptedPack(json) ? json : null;
  } catch {
    return null;
  }
}

export function getGateState(): GateState { return loadRecord('gate', GATE).value; }
function saveGate(s: GateState) { saveRecord('gate', GATE, s); }

export async function initGate(): Promise<GateStatus> {
  const state = getGateState();
  encrypted = await fetchPack();
  if (!encrypted) return { state, packAvailable: false, pack: null, needsPassword: false };
  if (state.mode === 'family' && state.key && state.salt === encrypted.kdf.salt) {
    try {
      const pack = await decryptWithKey<FamilyPack>(encrypted, fromB64(state.key));
      return { state, packAvailable: true, pack, needsPassword: false };
    } catch {
      // Lösenordet har bytts sedan enheten låstes upp.
    }
  }
  return { state, packAvailable: true, pack: null, needsPassword: true };
}

/** Låser upp med lösenord. Returnerar paketet, eller null vid fel lösenord. */
export async function openWithPassword(password: string): Promise<FamilyPack | null> {
  if (!encrypted) encrypted = await fetchPack();
  if (!encrypted) return null;
  try {
    const { data, rawKey } = await unlockPack<FamilyPack>(encrypted, password);
    saveGate({ v: 1, opened: true, mode: 'family', salt: encrypted.kdf.salt, key: toB64(rawKey) });
    return data;
  } catch {
    return null;
  }
}

export function openPublic() {
  const s = getGateState();
  saveGate({ ...s, opened: true, mode: s.key ? s.mode : 'public' });
}

/** Glömmer nyckeln på den här enheten. Hjältarnas framsteg påverkas inte. */
export function lockGate() { saveGate(GATE.defaults()); }
