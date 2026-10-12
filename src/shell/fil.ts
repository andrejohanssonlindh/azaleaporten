// Filer in och ut ur webbläsaren: säkerhetskopior och hjältefiler.

export function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Läser en vald fil som JSON. Ger undefined om den inte går att tolka. */
export async function readJson(file: File): Promise<unknown> {
  try { return JSON.parse(await file.text()); } catch { return undefined; }
}

/** Ett filnamn som fungerar överallt (namnet kommer från barnet). */
export const fileSafe = (s: string) => s.normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'hjalte';

export const today = () => new Date().toISOString().slice(0, 10);
