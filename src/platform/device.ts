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
  doUpdate = registerSW({
    onNeedRefresh() { updateReady.value = true; },
  });
}

export function applyUpdate() {
  if (doUpdate) doUpdate(true);
  else location.reload();
}

// Uppläsningen bor i speech.ts (ingen PWA-import där, så spelen kan använda den i tester).
export { canSpeak, speak } from './speech';
