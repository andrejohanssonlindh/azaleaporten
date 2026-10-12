import { beforeEach, describe, expect, it } from 'vitest';
import { createHero, getHeroState, getProfile, saveHeroState } from '../src/platform/profiles';
import { animalOpen, changeAnimal, changeClass, changeName, FORVANDLING } from '../src/platform/rpg/forvandling';
import { START_ANIMALS } from '../src/content/heroes';
import { freshStorage } from './helpers';

beforeEach(() => freshStorage());

const hero = (name = 'Hjälte1') => createHero({ name, animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 3 }).id;
const rich = (hid: string, kastanjer = 1000, level = 1) => saveHeroState(hid, { ...getHeroState(hid), kastanjer, level });

describe('Förvandlingen', () => {
  it('nya hjältar väljer bara bland djuren utan lås', () => {
    expect(START_ANIMALS.some((a) => a.id === 'tiger')).toBe(false);
    expect(START_ANIMALS.some((a) => a.id === 'rav')).toBe(true);
  });

  it('byter djur mot kastanjer, men bara till upplåsta djur', () => {
    const hid = hero();
    rich(hid);
    expect(animalOpen(hid, 'tiger')).toBe(false);
    expect(changeAnimal(hid, 'tiger')).toBe(false);
    expect(changeAnimal(hid, 'bjorn')).toBe(true);
    expect(getProfile(hid)!.animal).toBe('bjorn');
    expect(getHeroState(hid).kastanjer).toBe(1000 - FORVANDLING.djur);
    rich(hid, 1000, 3);
    expect(changeAnimal(hid, 'tiger')).toBe(true);
  });

  it('kostar för mycket? då händer ingenting', () => {
    const hid = hero();
    rich(hid, FORVANDLING.klass - 1);
    expect(changeClass(hid, 'trollkarl')).toBe(false);
    expect(getProfile(hid)!.heroClass).toBe('riddare');
    expect(getHeroState(hid).kastanjer).toBe(FORVANDLING.klass - 1);
  });

  it('nytt namn: inte tomt, inte samma som en annan hjälte', () => {
    hero('Hjälte2');
    const hid = hero();
    rich(hid);
    expect(changeName(hid, '  ')).toBe('tomt');
    expect(changeName(hid, 'hjälte2')).toBe('upptaget');
    expect(changeName(hid, 'Hjälte1')).toBe('samma');
    expect(changeName(hid, 'Hjälte3')).toBe('ok');
    expect(getProfile(hid)!.name).toBe('Hjälte3');
    expect(getHeroState(hid).kastanjer).toBe(1000 - FORVANDLING.namn);
  });
});
