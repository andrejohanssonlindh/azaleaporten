import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameModule, QuestionViewProps } from '../../platform/rpg/types';
import { diagnoseAny, errLabel, explainAny, parseAnswer } from './check';
import type { DrillGame, DrillQ, Explained, Part } from './types';

// En drillfråga. Samma flöde som klockfrågorna: öppen → (fel) rätta → klar.
// Bara första svaret räknas; ett fel måste rättas (efter tre försök visas svaret).

type Phase = 'open' | 'fixing' | 'done';

function Equation({ parts, input, onInput, inputRef, disabled, answer }: {
  parts: Part[]; input: string; onInput: (s: string) => void; inputRef: { current: HTMLInputElement | null }; disabled: boolean; answer: number | null;
}) {
  return (
    <div class="eq" aria-label="Uppgift">
      {parts.map((p, i) => p === null ? (
        answer !== null
          ? <span key={i} class="eq-ans">{answer}</span>
          : <input key={i} ref={inputRef} class="eq-input" inputMode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Ditt svar"
              value={input} disabled={disabled} onInput={(e) => onInput(e.currentTarget.value)} />
      ) : <span key={i} class={typeof p === 'number' ? 'eq-num' : 'eq-op'}>{p}</span>)}
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
    const [warn, setWarn] = useState('');
    const t0 = useRef(performance.now());
    const inputRef = useRef<HTMLInputElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [tries]);
    useEffect(() => { if (phase === 'done') nextRef.current?.focus({ preventScroll: true }); }, [phase]);

    function check() {
      if (phase === 'done') return;
      const given = parseAnswer(input);
      if (given === null) { setWarn('Skriv svaret med siffror.'); return; }
      setWarn('');
      const correct = given === q.answer;
      const tag = correct ? undefined : diagnoseAny(g, q, given);
      if (phase === 'open') onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
      if (correct) { setPhase('done'); return; }
      setPhase('fixing');
      setTries((n) => n + 1);
      setErr(explainAny(g, tag!, q, given));
      setInput('');
    }

    const wasWrong = tries > 0;
    const next = () => onDone(wasWrong ? (tries >= 3 ? 'shown' : 'self') : undefined);
    const feedback = phase === 'done' ? (wasWrong ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
    const task = tries >= 3 ? `Rätt svar är ${q.answer}. Skriv in det för att gå vidare.` : 'Rätta svaret för att gå vidare.';
    const Visual = g.Visual;

    return (
      <div class="kq drill">
        {hint && <p class="hint-tag">💡 {g.hint(q)}</p>}
        {Visual && <Visual q={q} hint={hint} done={phase === 'done'} />}
        <form class="eq-form" onSubmit={(e) => { e.preventDefault(); check(); }}>
          <Equation parts={q.parts} input={input} onInput={(s) => { setInput(s); setWarn(''); }} inputRef={inputRef}
            disabled={phase === 'done'} answer={phase === 'done' ? q.answer : null} />
          {phase !== 'done' && <button class="btn primary">Rätta</button>}
        </form>
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
