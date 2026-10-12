import { signal } from '@preact/signals';

// Uppläsning med webbläsarens talsyntes. Rösterna laddas ofta efter sidan (Chrome), så
// listan hålls i en signal som uppdateras vid 'voiceschanged'.
// En röst på enheten (localService) väljs före en röst på nätet: då lämnar texten aldrig enheten.

export type Lang = 'sv-SE' | 'en-GB';

const synth = (): SpeechSynthesis | undefined => (typeof globalThis.speechSynthesis !== 'undefined' ? globalThis.speechSynthesis : undefined);

const matches = (v: SpeechSynthesisVoice, lang: Lang) => v.lang.replace('_', '-').toLowerCase().startsWith(lang.slice(0, 2).toLowerCase());

function listVoices(): SpeechSynthesisVoice[] {
  try { return synth()?.getVoices() ?? []; } catch { return []; }
}

/** Enhetens röster (uppdateras när webbläsaren har laddat dem). */
export const voices = signal<SpeechSynthesisVoice[]>(listVoices());

try {
  const s = synth();
  s?.addEventListener?.('voiceschanged', () => { voices.value = listVoices(); });
} catch { /* ingen talsyntes */ }

/** Bästa rösten för språket: helst en som finns på enheten. */
export function voiceFor(lang: Lang, list = voices.value): SpeechSynthesisVoice | undefined {
  const all = list.filter((v) => matches(v, lang));
  return all.find((v) => v.localService && v.lang.replace('_', '-') === lang) ?? all.find((v) => v.localService) ?? all[0];
}

/** Finns en röst för språket? (Läs voices.value i en komponent för att rita om när rösterna laddats.) */
export const hasVoice = (lang: Lang = 'sv-SE') => !!voiceFor(lang);

export const canSpeak = () => !!synth();

/** Skriver om ord som rösten läser som förkortningar ("dam" blir annars "dekameter"). */
const ALIAS: Partial<Record<Lang, Record<string, string>>> = {
  'sv-SE': { dam: 'daam', damen: 'daamen', damer: 'daamer' },
};
export function sayable(text: string, lang: Lang): string {
  const a = ALIAS[lang];
  return a ? text.replace(/[A-Za-zÅÄÖåäö]+/g, (w) => a[w.toLowerCase()] ?? w) : text;
}

/** Pausmarkör: "ord. | En mening. | ord." läses i tre delar med en kort tystnad emellan. */
export const PAUS = ' | ';
const PAUS_MS = 650;
let turn = 0;

export function speak(text: string, lang: Lang = 'sv-SE', rate = 0.95) {
  try {
    const s = synth();
    if (!s) return;
    s.cancel();
    const my = ++turn;
    const parts = text.split('|').map((p) => p.trim()).filter(Boolean);
    const v = voiceFor(lang, listVoices());
    const say = (i: number) => {
      if (my !== turn || i >= parts.length) return;
      const u = new SpeechSynthesisUtterance(sayable(parts[i], lang));
      u.lang = lang;
      if (v) u.voice = v;
      u.rate = rate;
      if (i + 1 < parts.length) u.onend = () => setTimeout(() => say(i + 1), PAUS_MS);
      s.speak(u);
    };
    say(0);
  } catch {
    /* uppläsning saknas på enheten */
  }
}
