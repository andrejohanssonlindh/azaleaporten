import { useMemo, useState } from 'preact/hooks';
import { randomSeed, rngFrom } from '../../../platform/rng';
import { LEVEL_DESC, LEVELS, makeQ, type Level, type Mode } from '../logic/questions';
import { cap, fmt, periodWord, render, structs } from '../logic/language';
import { parseAny } from '../logic/parse';
import { QuestionView } from './QuestionView';
import type { FirstAnswer } from '../../../platform/rpg/types';
import { ClockFace } from './ClockFace';
import { Sky } from './Sky';

// Tidslabbet: fri övning (v0.1:s "Fritt") och tolkaren (v0.1:s "Tolka"). Inga stjärnor eller belöningar.

const MODES: { id: Mode; label: string }[] = [
  { id: 'clock', label: 'Klocka → siffror' }, { id: 'words', label: 'Ord → siffror' },
  { id: 'choice', label: 'Klocka → ord' }, { id: 'between', label: 'Tid emellan' },
];

/** onResult: första svaret på varje fråga (plattformen låter det mata repetitionsschemat). */
export function FreePractice({ onResult }: { onResult?: (q: unknown, r: FirstAnswer) => void } = {}) {
  const [mode, setMode] = useState<Mode>('clock');
  const [level, setLevel] = useState<Level>(1);
  const [n, setN] = useState(0);
  const [score, setScore] = useState({ ok: 0, all: 0 });
  const q = useMemo(() => makeQ(mode, level, rngFrom(randomSeed())), [mode, level, n]);
  const levels: Level[] = LEVELS.map((_, i) => i).filter((l) => l > 0 || mode === 'choice');
  return (
    <div class="labb">
      <div class="seg" role="group" aria-label="Övningstyp">
        {MODES.map((m) => (
          <button key={m.id} class={mode === m.id ? 'on' : ''} onClick={() => { setMode(m.id); if (m.id !== 'choice' && level === 0) setLevel(1); }}>{m.label}</button>
        ))}
      </div>
      <div class="seg" role="group" aria-label="Nivå">
        {levels.map((l) => <button key={l} class={level === l ? 'on' : ''} onClick={() => setLevel(l)}>Nivå {l}</button>)}
      </div>
      <p class="note">{LEVEL_DESC[level]}</p>
      <QuestionView key={n + mode + level} q={q} hint={false}
        onAnswer={(r) => { setScore((s) => ({ ok: s.ok + (r.correct ? 1 : 0), all: s.all + 1 })); onResult?.(q, r); }}
        onDone={() => setN((x) => x + 1)} />
      <p class="note">Rätt: {score.ok} av {score.all}</p>
    </div>
  );
}

export function Tolkaren() {
  const [v, setV] = useState('');
  const r = v.trim() ? parseAny(v) : null;
  return (
    <div class="tolka">
      <p class="note">Skriv en tid i ord eller siffror</p>
      <input class="big-input" value={v} onInput={(e) => setV(e.currentTarget.value)} placeholder="t.ex. tio i halv elva på kvällen" autocomplete="off" aria-label="Tid att tolka" />
      {v.trim() && !r && <p class="note">Förstår inte än. Prova "tjugo över tio", "fem i halv tre", "kvart i sju på kvällen" eller "14:35".</p>}
      {r && (
        <div class="tolka-out">
          <div class="clock-wrap"><ClockFace h={r.h12} m={r.m} size={200} /></div>
          <div class="tolka-digital">
            {r.h24 != null ? fmt(r.h24, r.m) : <>{fmt(r.h12 === 12 ? 0 : r.h12, r.m)} <small>eller</small> {fmt(r.h12 === 12 ? 12 : r.h12 + 12, r.m)}</>}
          </div>
          {r.h24 != null && <div class="sky-wrap"><Sky t={r.h24 + r.m / 60} /></div>}
          <p class="note">{structs(r.h12, r.m).length > 1 ? 'Kan sägas på två sätt' : 'Sägs'}</p>
          <ul class="alts">{structs(r.h12, r.m).map((s, i) => <li key={i}>{cap(render(s))}{r.h24 != null ? ' ' + periodWord(r.h24) : ''}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
