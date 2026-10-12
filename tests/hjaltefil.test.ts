import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHero, deleteHero, getHeroState, getMeta, getProfile, heroChangedAt, listHeroes, saveHeroState } from '../src/platform/profiles';
import { applyBundle, bundleHero, compareBundle, readBundle } from '../src/platform/storage/heroBundle';
import { listBackups } from '../src/platform/storage/backup';
import { kv } from '../src/platform/storage/kv';
import { loadRecord, saveRecord } from '../src/platform/storage/record';
import { freshStorage } from './helpers';

beforeEach(() => { freshStorage(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-01T10:00:00Z')); });
afterEach(() => { vi.useRealTimers(); });

const hero = (name: string) => createHero({ name, animal: 'rav', color: 'azalea', heroClass: 'riddare', grade: 4 });
const later = (min: number) => vi.setSystemTime(Date.now() + min * 60_000);
/** Som när filen sparas och laddas: genom JSON. */
const viaFile = <T>(x: T): unknown => JSON.parse(JSON.stringify(x));

describe('hjältefilen', () => {
  it('packar alla hjältens poster och inget annat', () => {
    const a = hero('Hjälte1');
    const b = hero('Hjälte2');
    saveHeroState(a.id, { ...getHeroState(a.id), xp: 7, kastanjer: 12 });
    const pkg = bundleHero(a.id);
    expect(pkg.heroId).toBe(a.id);
    expect(pkg.name).toBe('Hjälte1');
    expect(Object.keys(pkg.records).sort()).toEqual(kv.keys(`h:${a.id}:`).map((k) => k.slice(`h:${a.id}:`.length)).sort());
    expect(JSON.stringify(pkg)).not.toContain(b.id);
    expect(JSON.stringify(pkg)).not.toContain('gate');
    expect((pkg.records.hero as any).kastanjer).toBe(12);
    expect(getProfile(a.id)!.lastSavedAt).toBe(pkg.savedAt);
  });

  it('återställer en raderad hjälte precis som den var', () => {
    const a = hero('Hjälte1');
    saveHeroState(a.id, { ...getHeroState(a.id), level: 4, blad: 33 });
    const before = Object.fromEntries(kv.keys(`h:${a.id}:`).map((k) => [k, kv.get(k)]));
    const file = viaFile(bundleHero(a.id));
    deleteHero(a.id);
    expect(listHeroes()).toEqual([]);

    const pkg = readBundle(file)!;
    expect(compareBundle(pkg).status).toBe('ny');
    applyBundle(pkg);
    expect(listHeroes().map((h) => h.id)).toEqual([a.id]);
    expect(getHeroState(a.id)).toMatchObject({ level: 4, blad: 33 });
    expect(getProfile(a.id)).toEqual({ ...(before[`h:${a.id}:profile`] as any), lastSavedAt: '2026-10-01T10:00:00.000Z' });
  });

  it('flyttar hjälten till en annan enhet med samma id', () => {
    const a = hero('Hjälte1');
    saveHeroState(a.id, { ...getHeroState(a.id), level: 3 });
    const file = viaFile(bundleHero(a.id));

    freshStorage(); // den andra enheten
    hero('Hjälte2');
    applyBundle(readBundle(file)!);
    expect(listHeroes().map((h) => h.name)).toEqual(['Hjälte2', 'Hjälte1']);
    expect(getProfile(a.id)!.name).toBe('Hjälte1');
    expect(getHeroState(a.id).level).toBe(3);
    expect(getMeta().heroes).toHaveLength(2);
  });

  it('varnar när hjälten här har spelat efter att filen sparades', () => {
    const a = hero('Hjälte1');
    later(1);
    const file = readBundle(viaFile(bundleHero(a.id)))!;
    expect(compareBundle(file).status).toBe('nyare');

    later(5);
    saveHeroState(a.id, { ...getHeroState(a.id), xp: 50 });
    expect(compareBundle(file)).toMatchObject({ status: 'äldre', here: { level: 1 } });

    applyBundle(file);
    expect(getHeroState(a.id).xp).toBe(0);
    expect(listBackups().length).toBeGreaterThan(0);
    // Den ersatta hjälten finns kvar i den automatiska säkerhetskopian.
    const snap = kv.get<any>(listBackups().at(-1)!);
    expect(snap.data[`h:${a.id}:hero`].xp).toBe(50);
  });

  it('räknar inte ett besök (profilen) som en ändring', () => {
    const a = hero('Hjälte1');
    const changed = heroChangedAt(a.id);
    later(5);
    const p = getProfile(a.id)!;
    saveRecord(`h:${a.id}:profile`, { version: 1, defaults: () => p }, { ...p, lastActiveAt: new Date().toISOString() });
    expect(heroChangedAt(a.id)).toBe(changed);
  });

  it('tar ersatta poster bort, så inget blandas mellan filen och enheten', () => {
    const a = hero('Hjälte1');
    const file = readBundle(viaFile(bundleHero(a.id)))!;
    kv.set(`h:${a.id}:area:klocka`, { v: 1, stars: 3 });
    applyBundle(file);
    expect(kv.get(`h:${a.id}:area:klocka`)).toBeUndefined();
  });

  it('en post från en nyare app blir skrivskyddad, inte överskriven', () => {
    const a = hero('Hjälte1');
    const file = viaFile(bundleHero(a.id)) as any;
    file.records.hero = { ...file.records.hero, v: 99, xp: 5 };
    applyBundle(readBundle(file)!);
    const r = loadRecord(`h:${a.id}:hero`, { version: 1, defaults: () => ({ v: 1 }) });
    expect(r.readOnly).toBe(true);
    expect((kv.get(`h:${a.id}:hero`) as any).v).toBe(99);
  });

  it('godtar inte annat än hjältefiler', () => {
    const a = hero('Hjälte1');
    const good = viaFile(bundleHero(a.id)) as any;
    expect(readBundle(good)).not.toBeNull();
    expect(readBundle(undefined)).toBeNull();
    expect(readBundle({ format: 'azaleaporten-export', v: 1, data: {} })).toBeNull();
    expect(readBundle({ ...good, v: 2 })).toBeNull();
    expect(readBundle({ ...good, heroId: 'x:y' })).toBeNull();
    expect(readBundle({ ...good, heroId: 'annan' })).toBeNull(); // profilens id stämmer inte
    expect(readBundle({ ...good, records: { ...good.records, '../gate': { v: 1 } } })).toBeNull();
    expect(readBundle({ ...good, records: { ...good.records, hero: 'trasig' } })).toBeNull();
    expect(readBundle({ ...good, records: { ...good.records, hero: { xp: 1 } } })).toBeNull();
  });
});
