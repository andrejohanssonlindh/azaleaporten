import { useState } from 'preact/hooks';
import { dataRev, go, toast, touch } from '../state';
import { currentList, getVeckansRecord, MAX_WORDS, parseWords, saveList } from '../platform/learning/veckans';
import type { Profile } from '../platform/profiles';

// Veckans ord: kortet där barnet övar (Stavningsträsket, Övningsängen) och rutan där en vuxen skriver in orden.

export function VeckansCard({ hid, hideEmpty = false }: { hid: string; hideEmpty?: boolean }) {
  dataRev.value;
  const list = currentList(hid);
  if (!list) return hideEmpty ? null : <p class="note">Tips: en vuxen kan skriva in veckans stavningsord från skolan i Vuxenläge.</p>;
  const shown = list.words.slice(0, 4).join(', ');
  return (
    <section class="mist-banner veckans-banner">
      <span class="mist-icon" aria-hidden="true">📝</span>
      <div>
        <b>Veckans ord</b>
        <small>{list.words.length} ord från skolan: {shown}{list.words.length > 4 ? ' …' : ''}</small>
      </div>
      <button class="btn small primary" onClick={() => go('veckans')}>Öva!</button>
    </section>
  );
}

const fmtDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

export function VeckansEditor({ p }: { p: Profile }) {
  dataRev.value;
  const list = currentList(p.id);
  const [text, setText] = useState(() => list?.words.join('\n') ?? '');
  const words = parseWords(text);
  const old = getVeckansRecord(p.id).lists.length - (list ? 1 : 0);
  return (
    <div class="veckans-editor">
      <label>Veckans ord (ett per rad, eller med komma emellan)
        <textarea rows={5} value={text} spellcheck={false} onInput={(e) => setText(e.currentTarget.value)}
          placeholder={'hoppa\nglass\nsjö\n…'} />
      </label>
      <span class="row">
        <button class="btn small" disabled={!words.length} onClick={() => { saveList(p.id, words); touch(); toast(`Sparat: ${words.length} ord`); }}>Spara veckans ord</button>
        <small class="muted">{words.length ? `${words.length} ord${words.length === MAX_WORDS ? ' (max)' : ''}` : ''}</small>
      </span>
      <small class="muted">
        {list ? `Nuvarande lista skrevs in ${fmtDay(list.day)}. ` : 'Ingen lista den här veckan. '}
        Orden blir ett uppdrag varje dag i en vecka och kommer sedan tillbaka som repetition i Stavningsträsket.
        {old > 0 && ` ${old} tidigare ${old === 1 ? 'lista finns' : 'listor finns'} kvar i repetitionen.`}
      </small>
    </div>
  );
}
