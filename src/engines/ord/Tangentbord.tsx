import { useState } from 'preact/hooks';

// Ett svenskt tangentbord i appen, för pekskärmar. Surfplattans och mobilens eget tangentbord
// rättar stavningen automatiskt, och då blir stavningsövningar meningslösa.

const ROWS = ['qwertyuiopå', 'asdfghjklöä', 'zxcvbnm'];

/** Pekskärm (iPad, mobil)? Då används appens tangentbord i stället för enhetens. */
export function isTouch(): boolean {
  try { return matchMedia('(pointer: coarse)').matches; } catch { return false; }
}

interface Props { onKey(ch: string): void; onBack(): void; onSubmit(): void }

export function Tangentbord({ onKey, onBack, onSubmit }: Props) {
  const [shift, setShift] = useState(false);
  const key = (ch: string) => {
    onKey(shift ? ch.toLocaleUpperCase('sv') : ch);
    setShift(false);
  };
  return (
    <div class="kbd" role="group" aria-label="Tangentbord">
      {ROWS.map((row, r) => (
        <div class="kbd-row" key={row}>
          {r === 2 && <button type="button" class={`kbd-key wide${shift ? ' on' : ''}`} aria-label="Stor bokstav" aria-pressed={shift} onClick={() => setShift((s) => !s)}>⇧</button>}
          {[...row].map((ch) => (
            <button type="button" key={ch} class="kbd-key" onClick={() => key(ch)}>{shift ? ch.toLocaleUpperCase('sv') : ch}</button>
          ))}
          {r === 2 && <button type="button" class="kbd-key wide" aria-label="Sudda" onClick={onBack}>⌫</button>}
        </div>
      ))}
      <div class="kbd-row">
        <button type="button" class="kbd-key space" aria-label="Mellanslag" onClick={() => onKey(' ')}>mellanslag</button>
        <button type="button" class="kbd-key ok" onClick={onSubmit}>Rätta</button>
      </div>
    </div>
  );
}
