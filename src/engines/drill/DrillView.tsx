import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameModule, QuestionViewProps } from '../../platform/rpg/types';
import { diagnoseAny, errLabel, explainAny, fmtNum, isRight, parseAnswer, sameNumber } from './check';
import { Tools } from './Tools';
import type { DrillGame, DrillQ, Explained, Frac, Part } from './types';

// En drillfråga. Samma flöde som klockfrågorna: öppen → (fel) rätta → klar.
// Bara första svaret räknas; ett fel måste rättas (efter tre försök visas svaret).
// Svaret skrivs i en ruta i uppställningen, eller väljs bland knappar (q.choices).

type Phase = 'open' | 'fixing' | 'done';

const isFrac = (p: Part): p is Frac => typeof p === 'object' && p !== null;

interface SlotProps { q: DrillQ; input: string; onInput: (s: string) => void; inputRef: { current: HTMLInputElement | null }; done: boolean }

/** Rutan där barnet svarar (eller svaret, när frågan är klar). */
function Slot({ q, input, onInput, inputRef, done, small = false }: SlotProps & { small?: boolean }) {
  if (done) return <span class={`eq-ans${small ? ' small' : ''}${q.choices ? ' chosen' : ''}`}>{q.choices ? q.choices.find((c) => sameNumber(c.value, q.answer))?.label : fmtNum(q.answer)}</span>;
  if (q.choices) return <span class={`eq-blank${small ? ' small' : ''}`}>?</span>;
  return (
    <input ref={inputRef} class={`eq-input${small ? ' small' : ''}`} inputMode={q.keypad === 'decimal' ? 'decimal' : 'numeric'}
      autocomplete="off" aria-label="Ditt svar" value={input} onInput={(e) => onInput(e.currentTarget.value)} />
  );
}

function FracView({ f, slot }: { f: Frac; slot: SlotProps }) {
  const part = (v: number | null) => (v === null ? <Slot {...slot} small /> : <span>{v}</span>);
  return <span class="eq-frac"><span class="eq-frac-n">{part(f.n)}</span><span class="eq-frac-d">{part(f.d)}</span></span>;
}

function Equation(slot: SlotProps) {
  return (
    <div class="eq" aria-label="Uppgift">
      {slot.q.parts.map((p, i) =>
        p === null ? <Slot key={i} {...slot} />
          : isFrac(p) ? <FracView key={i} f={p} slot={slot} />
            : typeof p === 'number' ? <span key={i} class="eq-num">{fmtNum(p)}</span>
              : <span key={i} class={/^[+−·/=<>:≈]$/.test(p) ? 'eq-op' : 'eq-unit'}>{p}</span>)}
    </div>
  );
}

export function makeDrillView<Q extends DrillQ>(g: DrillGame<Q>) {
  return function DrillView({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
    const q = raw as Q;
    const [phase, setPhase] = useState<Phase>('open');
    const [tries, setTries] = useState(0);
    const [err, setErr] = useState<Explained | null>(null);
    const [input, setInput] = useState('');
    const [wrongChoices, setWrongChoices] = useState<number[]>([]);
    const [warn, setWarn] = useState('');
    const t0 = useRef(performance.now());
    const inputRef = useRef<HTMLInputElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [tries]);
    useEffect(() => { if (phase === 'done') nextRef.current?.focus({ preventScroll: true }); }, [phase]);

    function check(given: number) {
      if (phase === 'done') return;
      setWarn('');
      const correct = isRight(q, given);
      const tag = correct ? undefined : diagnoseAny(g, q, given);
      if (phase === 'open') onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
      if (correct) { setPhase('done'); return; }
      if (q.choices) setWrongChoices((w) => [...w, given]);
      setPhase('fixing');
      setTries((n) => n + 1);
      setErr(explainAny(g, tag!, q, given));
      setInput('');
    }

    function submit() {
      const given = parseAnswer(input);
      if (given === null) { setWarn(q.keypad === 'decimal' ? 'Skriv svaret med siffror, t.ex. 2,5.' : 'Skriv svaret med siffror.'); return; }
      check(given);
    }

    const wasWrong = tries > 0;
    // Vid flerval visas aldrig svaret: man hittar det själv bland de kvarvarande alternativen.
    const next = () => onDone(wasWrong ? (tries >= 3 && !q.choices ? 'shown' : 'self') : undefined);
    const feedback = phase === 'done' ? (wasWrong ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
    const task = q.choices ? 'Välj ett annat alternativ.' : tries >= 3 ? `Rätt svar är ${fmtNum(q.answer)}. Skriv in det för att gå vidare.` : 'Rätta svaret för att gå vidare.';
    const Visual = g.Visual;
    const slot: SlotProps = { q, input, onInput: (s) => { setInput(s); setWarn(''); }, inputRef, done: phase === 'done' };

    return (
      <div class="kq drill">
        {hint && <p class="hint-tag">💡 {g.hint(q)}</p>}
        {q.prompt && <p class="drill-prompt">{q.prompt}</p>}
        {Visual && <Visual q={q} hint={hint} done={phase === 'done'} />}
        <form class="eq-form" onSubmit={(e) => { e.preventDefault(); if (!q.choices) submit(); }}>
          <Equation {...slot} />
          {phase !== 'done' && !q.choices && (
            <div class="row center-row">
              {q.keypad === 'signed' && (
                <button type="button" class="btn sign-btn" aria-label="Byt tecken"
                  onClick={() => { setInput((s) => (s.startsWith('-') || s.startsWith('−') ? s.slice(1) : `-${s}`)); inputRef.current?.focus(); }}>±</button>
              )}
              <button class="btn primary">Rätta</button>
            </div>
          )}
        </form>
        {q.choices && phase !== 'done' && (
          <div class={`drill-choices${q.choices.some((c) => c.label.length > 3) ? ' words' : ''}`} role="group" aria-label="Välj svar">
            {q.choices.map((c) => (
              <button key={c.label} type="button" class={`btn drill-choice${wrongChoices.includes(c.value) ? ' wrong' : ''}`}
                disabled={wrongChoices.includes(c.value)} onClick={() => check(c.value)}>{c.label}</button>
            ))}
          </div>
        )}
        {warn && <p class="warn-line" role="alert">{warn}</p>}
        <p class={`feedback ${phase === 'done' ? 'ok' : 'bad'}`} role="status">{feedback}</p>
        {phase === 'fixing' && err && (
          <div class="errcard shake" key={tries}>
            <div class="err-title">{err.title}</div>
            <div class="err-text">{err.text}</div>
            <div class="err-task">{task}</div>
          </div>
        )}
        {phase === 'done' && <p class="explain">{g.solution(q)}</p>}
        {phase === 'done' && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
        {q.tools && <Tools qKey={raw} calcOn={q.tools === 'raknare'} notes={g.notes?.(q) ?? []} />}
      </div>
    );
  };
}

/** Gör ett drillspel till en frågefabrik för plattformen. */
export function drillModule<Q extends DrillQ>(g: DrillGame<Q>): GameModule {
  return {
    id: g.id,
    makeQuestion: (spec, rng) => g.make(spec, rng),
    skillOf: (q) => (q as Q).skill,
    specsForSkill: (s) => g.specsForSkill(s),
    errLabel: (tag) => errLabel(g as unknown as DrillGame<DrillQ>, tag),
    View: makeDrillView(g),
  };
}
