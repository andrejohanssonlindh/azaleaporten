import { cleanName, getHeroState, getProfile, nameTaken, saveHeroState, saveProfile } from '../profiles';
import { ANIMALS, CLASSES, type AnimalId, type ClassId } from '../../content/heroes';
import { unlocked, type Unlock } from './wardrobe';

// Förvandlingen i Skräddaren: byt djur, klass eller namn. Dyrt med flit, så att valet vid start betyder något.

export const FORVANDLING = { djur: 100, klass: 200, namn: 150 };

export function animalOpen(hid: string, id: string): boolean {
  const a = ANIMALS.find((x) => x.id === id);
  return !!a && (!('unlock' in a) || unlocked(hid, a.unlock as Unlock));
}

function pay(hid: string, cost: number): boolean {
  const s = getHeroState(hid);
  if (s.kastanjer < cost) return false;
  saveHeroState(hid, { ...s, kastanjer: s.kastanjer - cost });
  return true;
}

export function changeAnimal(hid: string, id: AnimalId): boolean {
  const p = getProfile(hid);
  if (!p || p.animal === id || !animalOpen(hid, id) || !pay(hid, FORVANDLING.djur)) return false;
  saveProfile({ ...p, animal: id });
  return true;
}

export function changeClass(hid: string, id: ClassId): boolean {
  const p = getProfile(hid);
  if (!p || p.heroClass === id || !CLASSES.some((c) => c.id === id) || !pay(hid, FORVANDLING.klass)) return false;
  saveProfile({ ...p, heroClass: id });
  return true;
}

export type NameResult = 'ok' | 'tomt' | 'samma' | 'upptaget' | 'kastanjer';

export function changeName(hid: string, raw: string): NameResult {
  const p = getProfile(hid);
  const name = cleanName(raw);
  if (!p || !name) return 'tomt';
  if (name === p.name) return 'samma';
  if (nameTaken(name, hid)) return 'upptaget';
  if (!pay(hid, FORVANDLING.namn)) return 'kastanjer';
  saveProfile({ ...p, name });
  return 'ok';
}
