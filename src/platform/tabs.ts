import { signal } from '@preact/signals';

// Bara en flik åt gången får spela. Två öppna flikar läser in data var för sig och skulle annars skriva
// över varandras framsteg. Den senast öppnade fliken vinner: den ropar "här" och alla andra pausar.
// Vill man fortsätta i en pausad flik laddas den om (så att den läser in det den andra fliken sparade).

const CHANNEL = 'azaleaporten:flikar';

/** true när en annan flik har tagit över. */
export const pausedByOtherTab = signal(false);

export function setupTabGuard() {
  if (typeof BroadcastChannel === 'undefined') return;
  const ch = new BroadcastChannel(CHANNEL);
  ch.onmessage = (e) => { if (e.data === 'här') pausedByOtherTab.value = true; };
  ch.postMessage('här');
}

/** Fortsätt i den här fliken: ladda om, så att den läser färsk data och tar över. */
export function takeOverTab() {
  location.reload();
}
