import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GameModule, QuestionViewProps } from '../../platform/rpg/types';
import { canSpeak, hasVoice, speak, voices } from '../../platform/speech';
import { diagnoseAny, errLabel, explainAny, hintFor, isRight, norm, same } from './check';
import { isTouch, Tangentbord } from './Tangentbord';
import type { Explained, OrdGame, OrdKind, OrdQ } from './types';

// En ordfråga. Samma flöde som drill- och klockfrågorna: öppen → (fel) rätta → klar.
// Bara första svaret räknas; ett fel måste rättas. Ett skrivet ord visas efter tre försök;
// vid val och markera hittar barnet själv rätt bland det som är kvar.

type Phase = 'open' | 'fixing' | 'done';

/** Meningen med luckan ('___'), tom eller ifylld. */
function Gap({ sentence, fill }: { sentence: string; fill?: string }) {
  const i = sentence.indexOf('___');
  if (i < 0) return <p class="ord-sentence">{sentence}</p>;
  return (
    <p class="ord-sentence">
      {sentence.slice(0, i)}<span class={`ord-gap${fill ? ' filled' : ''}`}>{fill ?? '  '}</span>{sentence.slice(i + 3)}
    </p>
  );
}

const MISS: Explained = { title: 'Leta vidare', text: 'Ordet du tryckte på stämmer. Läs meningen långsamt, ett ord i taget. Vilket ord ser fel ut?' };

export function makeOrdView<Q extends OrdQ>(g: OrdGame<Q>) {
  return function OrdView({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
    const q = raw as Q;
    voices.value; // rita om när enhetens röster har laddats
    const [phase, setPhase] = useState<Phase>('open');
    const [tries, setTries] = useState(0);
    const [err, setErr] = useState<Explained | null>(null);
    const [input, setInput] = useState('');
    const [wrong, setWrong] = useState<string[]>([]);
    const [warn, setWarn] = useState('');
    const [soundHelp, setSoundHelp] = useState(false);
    const [noSound, setNoSound] = useState(false);
    const t0 = useRef(performance.now());
    const inputRef = useRef<HTMLInputElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const kindAtAnswer = useRef<OrdKind | null>(null);
    const touch = useMemo(isTouch, []);

    // Diktat kräver en svensk röst. Saknas den (eller hör barnet inget) blir frågan ett val i stället.
    const listen = q.kind === 'skriv' && !noSound && hasVoice('sv-SE');
    const kind: OrdKind = kindAtAnswer.current ?? (q.kind === 'skriv' && !listen ? 'val' : q.kind);
    const say = () => { if (q.say) speak(q.say, 'sv-SE', kind === 'skriv' ? 0.85 : 0.95); };

    useEffect(() => { if (kind === 'skriv') say(); }, [kind]);
    useEffect(() => { if (kind === 'skriv') inputRef.current?.focus({ preventScroll: true }); }, [tries, kind]);
    // Som attribut: Preact sätter annars egenskapen autocorrect, och strängen "off" blir då sann (= på).
    useEffect(() => { inputRef.current?.setAttribute('autocorrect', 'off'); }, [kind]);
    useEffect(() => { if (phase === 'done') nextRef.current?.focus({ preventScroll: true }); }, [phase]);

    function first(correct: boolean, tag?: string) {
      if (phase !== 'open') return;
      kindAtAnswer.current = kind;
      onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
    }

    function wrongAnswer(e: Explained) {
      setPhase('fixing');
      setTries((n) => n + 1);
      setErr(e);
    }

    function checkText(given: string) {
      if (phase === 'done') return;
      setWarn('');
      if (!norm(given)) { setWarn('Skriv ordet först.'); return; }
      const correct = isRight(q, given);
      const tag = correct ? undefined : diagnoseAny(g, q, given);
      first(correct, tag);
      if (correct) { setPhase('done'); return; }
      if (kind === 'val') setWrong((w) => [...w, given]);
      else setInput('');
      wrongAnswer(explainAny(g, tag!, q, given));
    }

    function checkToken(i: number) {
      if (phase === 'done') return;
      const correct = q.targets!.includes(i);
      const tag = correct ? undefined : (q.missTag ?? 'annat');
      first(correct, tag);
      if (correct) { setPhase('done'); return; }
      setWrong((w) => [...w, String(i)]);
      wrongAnswer(MISS);
    }

    const wasWrong = tries > 0;
    const next = () => onDone(wasWrong ? (tries >= 3 && kind === 'skriv' ? 'shown' : 'self') : undefined);
    const feedback = phase === 'done' ? (wasWrong ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
    const task = kind === 'val' ? 'Välj ett annat alternativ.' : kind === 'markera' ? 'Leta vidare!'
      : tries >= 3 ? `Så här stavas ordet: ${q.answer}. Skriv av det för att gå vidare.` : 'Rätta ordet för att gå vidare.';
    const done = phase === 'done';
    const status = (
      <>
        {warn && <p class="warn-line" role="alert">{warn}</p>}
        <p class={`feedback ${done ? 'ok' : 'bad'}`} role="status">{feedback}</p>
        {phase === 'fixing' && err && (
          <div class="errcard shake" key={tries}>
            <div class="err-title">{err.title}</div>
            <div class="err-text">{err.text}</div>
            <div class="err-task">{task}</div>
          </div>
        )}
      </>
    );

    return (
      <div class="kq ord">
        {hint && <p class="hint-tag">💡 {hintFor(g, q)}</p>}
        <div class="ord-head">
          <p class="drill-prompt">{kind === 'val' && q.kind === 'skriv' ? 'Vilken stavning är rätt?' : q.prompt}</p>
          {kind !== 'skriv' && q.say && canSpeak() && hasVoice('sv-SE') && (
            <button type="button" class="speak" onClick={say} aria-label="Läs upp">🔊</button>
          )}
        </div>

        {kind === 'skriv' && !done && (
          <div class="ord-listen">
            <button type="button" class="btn big" onClick={say}>🔊 Lyssna igen</button>
            {!soundHelp
              ? <button type="button" class="link" onClick={() => setSoundHelp(true)}>Hör du inget?</button>
              : <p class="note">Kolla att ljudet är på och inte för lågt. Hörs ändå inget? <button type="button" class="link" onClick={() => setNoSound(true)}>Välj i stället</button></p>}
          </div>
        )}
        {q.kind === 'skriv' && kind === 'val' && !hasVoice('sv-SE') && <p class="note">Den här enheten kan inte läsa upp svenska, så du får välja i stället.</p>}

        {kind === 'markera'
          ? (
            <p class="ord-sentence ord-tokens" role="group" aria-label="Meningen">
              {q.tokens!.map((t, i) => {
                const hit = done && q.targets!.includes(i);
                const miss = wrong.includes(String(i));
                return <button key={i} type="button" class={`ord-token${hit ? ' hit' : ''}${miss ? ' miss' : ''}`} disabled={done || miss} onClick={() => checkToken(i)}>{t}</button>;
              })}
            </p>
          )
          : q.sentence && <Gap sentence={q.sentence} fill={done ? q.answer : undefined} />}

        {/* Vid skriv står rättningen ovanför rutan, så att den syns ovanför tangentbordet på en mobil. */}
        {kind === 'skriv' && status}
        {kind === 'skriv' && !done && (
          <form class="ord-form" onSubmit={(e) => { e.preventDefault(); checkText(input); }}>
            <input ref={inputRef} class="ord-input" value={input} lang="sv" aria-label="Skriv ordet"
              autocomplete="off" autocapitalize="off" spellcheck={false} inputMode={touch ? 'none' : 'text'} enterKeyHint="done"
              onInput={(e) => { setInput(e.currentTarget.value); setWarn(''); }} />
            {touch
              ? <Tangentbord onKey={(c) => { setInput((s) => s + c); setWarn(''); }} onBack={() => setInput((s) => s.slice(0, -1))} onSubmit={() => checkText(input)} />
              : <div class="row center-row"><button class="btn primary">Rätta</button></div>}
          </form>
        )}

        {kind === 'val' && !done && (
          <div class="drill-choices words" role="group" aria-label="Välj svar">
            {q.alts!.map((a) => {
              const off = wrong.some((w) => same(w, a.text, true));
              return <button key={a.text} type="button" class={`btn drill-choice ord-choice${off ? ' wrong' : ''}`} disabled={off} onClick={() => checkText(a.text)}>{a.text}</button>;
            })}
          </div>
        )}

        {kind !== 'skriv' && status}
        {done && <p class="explain">{g.solution(q)}</p>}
        {done && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
      </div>
    );
  };
}

/** Gör ett ordspel till en frågefabrik för plattformen. */
export function ordModule<Q extends OrdQ>(g: OrdGame<Q>): GameModule {
  return {
    id: g.id,
    makeQuestion: (spec, rng, ctx) => g.make(spec, rng, ctx),
    skillOf: (q) => (q as Q).skill,
    specsForSkill: (s) => g.specsForSkill(s),
    errLabel: (tag) => errLabel(g as unknown as OrdGame<OrdQ>, tag),
    View: makeOrdView(g),
  };
}
