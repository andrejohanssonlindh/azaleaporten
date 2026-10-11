import { beforeEach, describe, expect, it } from 'vitest';
import { kv, PREFIX, type MemoryBackend } from '../src/platform/storage/kv';
import { hasNewerData, loadRecord, mergeDefaults, saveRecord, type RecordSpec } from '../src/platform/storage/record';
import { exportAll, importReplace, listBackups, restoreBackup, snapshot } from '../src/platform/storage/backup';
import { freshStorage } from './helpers';

let backend: MemoryBackend;
beforeEach(() => { backend = freshStorage(); });

describe('kv', () => {
  it('lägger allt under prefixet och läser tillbaka JSON', () => {
    kv.set('a', { x: 1 });
    expect(backend.getItem(PREFIX + 'a')).toBe('{"x":1}');
    expect(kv.get('a')).toEqual({ x: 1 });
    expect(kv.keys()).toEqual(['a']);
  });

  it('flyttar undan trasig JSON i stället för att tappa den', () => {
    backend.setItem(PREFIX + 'trasig', '{inte json');
    expect(kv.get('trasig')).toBeUndefined();
    const saved = kv.keys('corrupt:trasig:');
    expect(saved).toHaveLength(1);
    expect(backend.getItem(PREFIX + saved[0])).toBe('{inte json');
  });

  it('ignorerar nycklar från andra appar på samma origin', () => {
    backend.setItem('klocka_Hjalte1', '{}');
    expect(kv.keys()).toEqual([]);
  });
});

describe('mergeDefaults', () => {
  it('fyller i saknade fält rekursivt men låter sparade värden vinna', () => {
    const d = { v: 2, a: 1, nested: { b: 2, c: 3 }, list: [1] };
    expect(mergeDefaults(d, { v: 2, a: 9, nested: { b: 7 }, list: [] })).toEqual({ v: 2, a: 9, nested: { b: 7, c: 3 }, list: [] });
  });
});

interface Thing { v: number; name: string; score: number; extra: { stars: number } }
const V2: RecordSpec<Thing> = {
  version: 2,
  defaults: () => ({ v: 2, name: '', score: 0, extra: { stars: 0 } }),
  migrations: { 1: (old) => ({ ...old, score: old.points * 10 }) },
};

describe('versionerade poster', () => {
  it('ger standardvärden när inget är sparat, utan att skriva', () => {
    const r = loadRecord('t', V2);
    expect(r.exists).toBe(false);
    expect(r.value.score).toBe(0);
    expect(kv.keys()).toEqual([]);
  });

  it('migrerar steg för steg, tar backup först och sparar resultatet', () => {
    kv.set('t', { v: 1, name: 'Hjälte1', points: 4 });
    const r = loadRecord('t', V2);
    expect(r.migratedFrom).toBe(1);
    expect(r.value).toMatchObject({ v: 2, name: 'Hjälte1', score: 40, extra: { stars: 0 } });
    expect(kv.get<Thing>('t')!.v).toBe(2);
    const backups = listBackups();
    expect(backups).toHaveLength(1);
    expect((kv.get(backups[0]) as any).data.t).toEqual({ v: 1, name: 'Hjälte1', points: 4 });
  });

  it('lämnar originalet orört och blir skrivskyddad om en migrering saknas', () => {
    kv.set('t', { v: 0, name: 'x' });
    const r = loadRecord('t', V2);
    expect(r.readOnly).toBe(true);
    expect(kv.get('t')).toEqual({ v: 0, name: 'x' });
    expect(saveRecord('t', V2, r.value)).toBe(false);
    expect(kv.get('t')).toEqual({ v: 0, name: 'x' });
  });

  it('skriver aldrig över data från en nyare version av appen', () => {
    kv.set('t', { v: 3, name: 'framtid', score: 5, ny: true });
    const r = loadRecord('t', V2);
    expect(r.readOnly).toBe(true);
    expect(hasNewerData()).toBe(true);
    expect(saveRecord('t', V2, { ...r.value, score: 0 })).toBe(false);
    expect(kv.get('t')).toEqual({ v: 3, name: 'framtid', score: 5, ny: true });
  });
});

describe('backup och export', () => {
  it('behåller bara de tre senaste backuperna', () => {
    kv.set('a', 1);
    for (let i = 0; i < 5; i++) snapshot('test ' + i);
    expect(listBackups()).toHaveLength(3);
  });

  it('exporterar inte portens nyckel', () => {
    kv.set('gate', { key: 'hemlig' });
    kv.set('h:1:profile', { v: 1 });
    expect(Object.keys(exportAll().data)).toEqual(['h:1:profile']);
  });

  it('import ersätter data men går att ångra via backup', () => {
    kv.set('h:1:profile', { v: 1, name: 'gammal' });
    importReplace({ format: 'azaleaporten-export', v: 1, exportedAt: '', appVersion: '', data: { 'h:2:profile': { v: 1, name: 'ny' } } });
    expect(kv.get('h:1:profile')).toBeUndefined();
    expect(kv.get('h:2:profile')).toEqual({ v: 1, name: 'ny' });
    restoreBackup(listBackups().find((k) => (kv.get(k) as any).reason === 'före import')!);
    expect(kv.get('h:1:profile')).toEqual({ v: 1, name: 'gammal' });
  });
});
