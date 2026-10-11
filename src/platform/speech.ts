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

export function speak(text: string, lang: Lang = 'sv-SE', rate = 0.95) {
  try {
    const s = synth();
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = voiceFor(lang, listVoices());
    if (v) u.voice = v;
    u.rate = rate;
    s.speak(u);
  } catch {
    /* uppläsning saknas på enheten */
  }
}
