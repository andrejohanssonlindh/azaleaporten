import { signal } from '@preact/signals';
import type { GateStatus } from './platform/gate/gate';

// Global UI-status. Sparad data läses direkt från lagringen (synkront);
// `dataRev` räknas upp efter ändringar så att vyer ritas om.

export const gate = signal<GateStatus | null>(null);
export const heroId = signal<string | null>(null);
/** Förra besöket för aktiv hjälte (för Mästare Kastanjs hälsning). */
export const previousVisit = signal<string | null>(null);
export const dataRev = signal(0);
export const touch = () => { dataRev.value++; };

/* ---------- hash-router (GitHub Pages saknar SPA-fallback) ---------- */
const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
export const route = signal<string[]>(parse());
addEventListener('hashchange', () => { route.value = parse(); window.scrollTo(0, 0); });
export function go(path: string) {
  const target = '#/' + path;
  if (location.hash === target) route.value = parse();
  else location.hash = target;
}

/* ---------- toasts ---------- */
export const toasts = signal<{ id: number; text: string }[]>([]);
let toastId = 0;
export function toast(text: string) {
  const id = ++toastId;
  toasts.value = [...toasts.value, { id, text }];
  setTimeout(() => { toasts.value = toasts.value.filter((t) => t.id !== id); }, 3200);
}
