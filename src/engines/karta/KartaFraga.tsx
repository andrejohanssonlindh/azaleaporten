import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameModule, QuestionViewProps } from '../../platform/rpg/types';
import { canSpeak, hasVoice, speak, voices } from '../../platform/speech';
import { parseAnswer } from '../drill/check';
import { diagnoseAny, errLabel, explainAny, felstavat, isRight } from './check';
import { Flagga, type FlaggData } from './Flagga';
import { KartaView } from './KartaView';
import type { Explained, KartaGame, KartaQ } from './types';

// En kartfråga. Samma flöde som de andra motorerna: öppen → (fel) rätta → klar. Bara första svaret räknas.
// peka: tryck på en plats (den markeras, namnet visas inte) och sedan Svara – det extra steget gör att ett
// slint med fingret inte blir ett fel. Vid val och peka hittar barnet själv rätt bland det som är kvar;
// ett skrivet namn eller tal visas efter tre försök.

type Phase = 'open' | 'fixing' | 'done';

export function makeKartaView<Q extends KartaQ>(g: KartaGame<Q>, flaggor: Record<string, FlaggData>) {
  return function KartaFraga({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
    const q = raw as Q;
    voices.value; // rita om när enhetens röster har laddats
    const [phase, setPhase] = useState<Phase>('open');
    const [tries, setTries] = useState(0);
    const [err, setErr] = useState<Explained | null>(null);
    const [input, setInput] = useState('');
    const [wrong, setWrong] = useState<string[]>([]);
    const [vald, setVald] = useState<string | undefined>();
    const [warn, setWarn] = useState('');
    const [stavat, setStavat] = useState('');
    const t0 = useRef(performance.now());
    const inputRef = useRef<HTMLInputElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    const typed = q.kind === 'skriv' || q.kind === 'tal';
    useEffect(() => { if (typed) inputRef.current?.focus({ preventScroll: true }); }, [tries]);
    useEffect(() => { if (phase === 'done') nextRef.current?.focus({ preventScroll: true }); }, [phase]);

    function check(given: string) {
      if (phase === 'done') return;
      setWarn('');
      const correct = isRight(q, given);
      const tag = correct ? undefined : diagnoseAny(q, given);
      if (phase === 'open') onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
      if (correct) {
        if (felstavat(q, given)) setStavat(given);
        setPhase('done');
        return;
      }
      if (!typed) setWrong((w) => [...w, given]);
      setVald(undefined);
      setPhase('fixing');
      setTries((n) => n + 1);
      setErr(explainAny(g, tag!, q, given));
      setInput('');
    }

    function submitTyped() {
      if (q.kind === 'tal') {
        const n = parseAnswer(input);
        if (n === null) { setWarn('Skriv svaret med siffror.'); return; }
        check(String(n));
        return;
      }
      if (!input.trim()) { setWarn('Skriv ett namn först.'); return; }
      check(input);
    }

    const done = phase === 'done';
    const wasWrong = tries > 0;
    const next = () => onDone(wasWrong ? (tries >= 3 && typed ? 'shown' : 'self') : undefined);
    const feedback = done ? (wasWrong ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
    const task = q.kind === 'val' ? 'Välj ett annat alternativ.'
      : q.kind === 'peka' ? 'Tryck någon annanstans på kartan.'
        : tries >= 3 ? `Rätt svar är ${q.answer}${q.enhet ? ` ${q.enhet}` : ''}. Skriv in det för att gå vidare.` : 'Rätta svaret för att gå vidare.';
    const speakable = canSpeak() && hasVoice('sv-SE');
    const flagAlts = q.alts?.some((a) => a.flagga);
    const long = q.alts?.some((a) => a.text.length > 16);

    return (
      <div class="kq karta">
        {hint && <p class="hint-tag">💡 {q.tips}</p>}
        <div class="ord-head">
          <p class="drill-prompt">{q.prompt}</p>
          {speakable && <button type="button" class="speak" onClick={() => speak(q.prompt)} aria-label="Läs upp">🔊</button>}
        </div>

        {q.pic && <div class="kar-pic" aria-hidden="true">{q.pic}</div>}
        {q.flagga && flaggor[q.flagga] && <div class="kar-flaggbild"><Flagga data={flaggor[q.flagga]} class="flagga stor" /></div>}

        {q.karta && (
          <KartaView k={q.karta} lyser={q.lyser} visa={done ? q.visa : undefined}
            onTap={q.kind === 'peka' && !done ? (id) => { setVald(id); setWarn(''); } : undefined}
            vald={q.kind === 'peka' ? (done ? q.answer : vald) : undefined}
            off={q.kind === 'peka' ? wrong : undefined}
            fore={q.kind === 'peka' ? q.answer : undefined} />
        )}

        {q.kind === 'peka' && !done && (
          <div class="row center-row">
            <button type="button" class="btn primary" disabled={!vald} onClick={() => vald && check(vald)}>Svara</button>
          </div>
        )}

        {q.kind === 'val' && !done && (
          <div class={flagAlts ? 'kar-flaggval' : long ? 'choices' : 'drill-choices words'} role="group" aria-label="Välj svar">
            {q.alts!.map((a, i) => {
              const off = wrong.includes(a.text);
              if (a.flagga && flaggor[a.flagga]) {
                return (
                  <button key={a.text} type="button" class={`btn kar-flaggknapp${off ? ' wrong' : ''}`} disabled={off} aria-label={`Flagga ${i + 1}`} onClick={() => check(a.text)}>
                    <Flagga data={flaggor[a.flagga]} />
                  </button>
                );
              }
              return <button key={a.text} type="button" class={`${long ? 'choice' : 'btn drill-choice'}${off ? ' wrong' : ''}`} disabled={off} onClick={() => check(a.text)}>{a.text}</button>;
            })}
          </div>
        )}

        {typed && !done && (
          <form class="eq-form" onSubmit={(e) => { e.preventDefault(); submitTyped(); }}>
            <div class="eq">
              <input ref={inputRef} class={`eq-input${q.kind === 'skriv' ? ' kar-namnruta' : ''}`}
                inputMode={q.kind === 'tal' ? 'numeric' : 'text'} autocomplete="off" autocapitalize="words" aria-label="Ditt svar"
                value={input} onInput={(e) => { setInput(e.currentTarget.value); setWarn(''); }} />
              {q.enhet && <span class="eq-unit">{q.enhet}</span>}
            </div>
            <div class="row center-row"><button class="btn primary">Rätta</button></div>
          </form>
        )}
        {typed && done && <p class="eq"><span class="eq-ans">{q.answer}</span>{q.enhet && <span class="eq-unit">{q.enhet}</span>}</p>}

        {warn && <p class="warn-line" role="alert">{warn}</p>}
        <p class={`feedback ${done ? 'ok' : 'bad'}`} role="status">{feedback}</p>
        {done && stavat && <p class="kar-stavas">Du skrev "{stavat}". Det stavas <b>{q.answer}</b>.</p>}
        {phase === 'fixing' && err && (
          <div class="errcard shake" key={tries}>
            <div class="err-title">{err.title}</div>
            <div class="err-text">{err.text}</div>
            <div class="err-task">{task}</div>
          </div>
        )}
        {done && <p class="explain">{q.los}</p>}
        {done && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
      </div>
    );
  };
}

/** Gör ett kartspel till en frågefabrik för plattformen. */
export function kartaModule<Q extends KartaQ>(g: KartaGame<Q>, flaggor: Record<string, FlaggData> = {}): GameModule {
  return {
    id: g.id,
    makeQuestion: (spec, rng, ctx) => g.make(spec, rng, ctx),
    skillOf: (q) => (q as Q).skill,
    specsForSkill: (s) => g.specsForSkill(s),
    errLabel: (tag) => errLabel(g as unknown as KartaGame<KartaQ>, tag),
    View: makeKartaView(g, flaggor),
    lessons: g.lessons,
  };
}
