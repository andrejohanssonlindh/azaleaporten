import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

// Enhetsnära saker: beständig lagring och uppdateringar av appen.

/** Ber webbläsaren att inte rensa vår lagring (viktigt på iPad/Safari). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageInfo(): Promise<{ persisted: boolean; usedKB: number | null }> {
  try {
    const persisted = (await navigator.storage?.persisted?.()) ?? false;
    const est = await navigator.storage?.estimate?.();
    return { persisted, usedKB: est?.usage != null ? Math.round(est.usage / 1024) : null };
  } catch {
    return { persisted: false, usedKB: null };
  }
}

/** true om appen körs installerad (från hemskärmen), inte i en vanlig webbläsarflik. */
export function isInstalled(): boolean {
  try {
    return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

/** true när en ny version är nedladdad och väntar. Visas bara på kartan/hjälteväljaren, aldrig mitt i en runda. */
export const updateReady = signal(false);
let doUpdate: ((reload?: boolean) => Promise<void>) | null = null;

export function setupUpdates() {
  if (import.meta.env.DEV) return;
  // Efter en tvingad uppdatering: ta bort ?v=… ur adressen igen.
  if (/[?&]v=\d+/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
  doUpdate = registerSW({
    onNeedRefresh() { updateReady.value = true; },
    // En installerad app (särskilt i mobilen) kan vara öppen i dagar utan att ladda om sidan, och då frågar den
    // aldrig efter en ny version. Fråga när appen kommer fram igen och en gång i halvtimmen.
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => { if (navigator.onLine !== false) reg.update().catch(() => {}); };
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    },
  });
}

/** Den vanliga vägen: den nya versionen tar över och sidan laddas om. Händer inget på några sekunder
 *  (det kan fastna, särskilt i mobilen) tvingar vi i stället fram den senaste versionen. */
export function applyUpdate() {
  if (!doUpdate) { location.reload(); return; }
  doUpdate(true).catch(() => {});
  setTimeout(() => { forceUpdate().catch(() => location.reload()); }, 4000);
}

const BASE = import.meta.env.BASE_URL;

/** Versionen som ligger på webben just nu, eller null om det inte går att fråga (t.ex. utan nät). */
export async function latestVersion(): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const v = (await r.json()) as { version?: unknown };
    return typeof v.version === 'string' ? v.version : null;
  } catch {
    return null;
  }
}

/** Tvingar fram den senaste versionen: avregistrerar appens service worker, tömmer appens cachar och laddar om.
 *  Rör bara appens filer, aldrig hjältarna (de ligger i localStorage). Görs bara när nätet fungerar,
 *  annars skulle appen inte gå att starta efteråt. */
export async function forceUpdate(): Promise<'ok' | 'offline'> {
  if ((await latestVersion()) == null) return 'offline';
  const scope = new URL(BASE, location.href).href;
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.filter((r) => r.scope === scope).map((r) => r.unregister()));
  } catch { /* finns ingen service worker är det bara att ladda om */ }
  try {
    // Andra appar på samma github.io-adress har egna cachar; töm bara våra (namnen innehåller vår adress).
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.includes(scope)).map((k) => caches.delete(k)));
  } catch { /* ingen Cache Storage */ }
  location.replace(`${scope}?v=${Date.now()}${location.hash}`);
  return 'ok';
}

// Uppläsningen bor i speech.ts (ingen PWA-import där, så spelen kan använda den i tester).
export { canSpeak, speak } from './speech';
