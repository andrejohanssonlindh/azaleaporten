import { useEffect, useRef, useState } from 'preact/hooks';
import type { QuestionViewProps } from '../../../platform/rpg/types';
import { cap, fmt, h12, periodWord, phraseParts, render, type Phrase } from '../logic/language';
import { parseTime } from '../logic/parse';
import { betweenSteps, diagBetween, diagnose, errTitle, explain, hmSwapTime } from '../logic/diagnose';
import { bD, bMin, durStr, type BetweenQ, type BTime, type KQ, type TimeQ } from '../logic/questions';
import { ClockFace } from './ClockFace';
import { Sky } from './Sky';

// En klockfråga. Flödet från v0.1: öppen → (fel) rätta → klar. Bara första svaret räknas;
// barnet måste rätta ett fel innan det går vidare (efter tre försök visas svaret).

type Phase = 'open' | 'fixing' | 'done';

function HintPhrase({ s }: { s: Phrase }) {
  const p = phraseParts(s);
  return <><span class="hint-min">{cap(p.min)}</span> <span class="hint-hour">{p.hour}</span></>;
}

function BCard({ t, label, sel, hint, onClick }: { t: BTime; label: string; sel: boolean; hint: boolean; onClick: () => void }) {
  return (
    <button class={`bcard${sel ? ' sel' : ''}`} onClick={onClick}>
      <span class="blabel">{label}</span>
      {t.fmt === 'clock' && <><ClockFace h={h12(t.h24)} m={t.m} ring={hint} size={120} /><span class="bsmall">{t.h24 < 12 ? 'Förmiddag' : 'Eftermiddag'}</span></>}
      {t.fmt === 'words' && <><span class="bwords">{hint ? <HintPhrase s={t.s} /> : cap(render(t.s))}</span><span class="bsmall">{periodWord(t.h24)}</span></>}
      {t.fmt === 'digits' && <span class="bdigits">{fmt(t.h24, t.m)}</span>}
    </button>
  );
}

export function QuestionView({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
  const q = raw as KQ;
  const [phase, setPhase] = useState<Phase>('open');
  const [tries, setTries] = useState(0);
  const [err, setErr] = useState<{ title: string; text: string } | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [wasWrong, setWasWrong] = useState(false);
  const [input, setInput] = useState('');
  const [dh, setDh] = useState('');
  const [dm, setDm] = useState('');
  const [warn, setWarn] = useState('');
  const [sel, setSel] = useState<'a' | 'b'>('a');
  const t0 = useRef(performance.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [tries]);
  useEffect(() => { if (phase === 'done') nextRef.current?.focus({ preventScroll: true }); }, [phase]);

  const fixedKind = (): 'self' | 'shown' | undefined => (wasWrong ? (q.mode !== 'choice' && tries >= 3 ? 'shown' : 'self') : undefined);
  const next = () => onDone(fixedKind());

  function answered(correct: boolean, errTag: string | undefined, e: { title: string; text: string } | null) {
    setWarn('');
    if (phase === 'open') onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag, hint });
    if (correct) { setPhase('done'); return; }
    setWasWrong(true);
    setPhase('fixing');
    setTries((n) => n + 1);
    setErr(e);
    setInput(''); setDh(''); setDm('');
  }

  /* ---------- klocka/ord → siffror ---------- */
  function checkTime() {
    const tq = q as TimeQ;
    if (phase === 'done') return;
    const p = parseTime(input);
    if (!p) { setWarn('Skriv t.ex. 0845, 845, 22:30 eller 9:05'); return; }
    const h24 = tq.isFm ? tq.h : tq.h + 12;
    const correct = p.h === h24 && p.mn === tq.m;
    const tag = correct ? undefined : diagnose(tq, p.h, p.mn, tq.mode === 'clock' ? hmSwapTime(tq.h, tq.m, tq.level) : null);
    answered(correct, tag, tag ? { title: errTitle(tag, tq, tq.mode, tq.level), text: explain(tag, tq, tq.mode, tq.level) } : null);
  }

  /* ---------- flerval ---------- */
  function choose(i: number) {
    const tq = q as TimeQ;
    if (phase === 'done') return;
    const o = tq.opts![i], correct = o.tag === 'correct';
    if (!correct) setWrong((w) => [...w, i]);
    answered(correct, correct ? undefined : o.tag, correct ? null : { title: errTitle(o.tag, tq, 'choice', tq.level), text: explain(o.tag, tq, 'choice', tq.level) });
  }

  /* ---------- tid emellan ---------- */
  function checkBetween() {
    const bq = q as BetweenQ;
    if (phase === 'done') return;
    const hv = dh.trim(), mv = dm.trim();
    if (!hv && !mv) { setWarn('Skriv antal timmar och minuter'); return; }
    if ((hv && !/^\d{1,2}$/.test(hv)) || (mv && !/^\d{1,2}$/.test(mv))) { setWarn('Skriv bara siffror'); return; }
    const uh = +hv || 0, um = +mv || 0, U = uh * 60 + um;
    if (um >= 60 && U === bD(bq)) { setWarn('Det stämmer, men 60 minuter är en timme. Skriv om det.'); return; }
    const correct = U === bD(bq) && um < 60;
    const d = correct ? null : diagBetween(bq, uh, um);
    answered(correct, d?.tag, d ? { title: d.title, text: d.text } : null);
    if (correct) setSel('b');
  }

  const feedback = phase === 'done' ? (wasWrong ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
  const answerText = q.mode === 'between' ? durStr(bD(q as BetweenQ)) : fmt((q as TimeQ).isFm ? (q as TimeQ).h : (q as TimeQ).h + 12, (q as TimeQ).m);
  const task = q.mode === 'choice' ? 'Välj rätt alternativ för att gå vidare.' : tries >= 3 ? `Rätt svar är ${answerText}. Skriv in det för att gå vidare.` : 'Rätta svaret för att gå vidare.';
  const showNextButton = phase === 'done';

  let body;
  if (q.kind === 'between') {
    const steps = betweenSteps(bMin(q.a), bMin(q.b));
    body = (
      <>
        <div class="sky-wrap"><Sky t={bMin(q[sel]) / 60} shortest /></div>
        <p class="qprompt">Hur lång tid är det mellan tiderna? Tryck på en tid för att se den på himlen.</p>
        <div class="bcards">
          <BCard t={q.a} label="Från" sel={sel === 'a'} hint={hint} onClick={() => setSel('a')} />
          <BCard t={q.b} label="Till" sel={sel === 'b'} hint={hint} onClick={() => setSel('b')} />
        </div>
        <form class="answer-row dur" onSubmit={(e) => { e.preventDefault(); checkBetween(); }}>
          <input ref={inputRef} inputMode="numeric" autocomplete="off" aria-label="Timmar" value={dh} disabled={phase === 'done'} onInput={(e) => setDh(e.currentTarget.value)} /><span>tim</span>
          <input inputMode="numeric" autocomplete="off" aria-label="Minuter" value={dm} disabled={phase === 'done'} onInput={(e) => setDm(e.currentTarget.value)} /><span>min</span>
          {!showNextButton && <button class="btn primary">Rätta</button>}
        </form>
        {phase === 'done' && <p class="explain">{steps.map((l, i) => (i === steps.length - 1 ? <b key={i}>{l}</b> : <span key={i}>{l}<br /></span>))}</p>}
      </>
    );
  } else {
    const h24 = q.isFm ? q.h : q.h + 12;
    const lvl0 = q.mode === 'choice' && q.level === 0;
    const showClock = q.mode !== 'words' || phase === 'done';
    body = (
      <>
        {q.mode === 'words' && (
          <div class="phrase">
            <div class="phrase-big">{hint ? <HintPhrase s={q.s} /> : cap(render(q.s))}</div>
            <div class="phrase-small">{periodWord(h24)}</div>
          </div>
        )}
        {showClock && <div class="clock-wrap"><ClockFace h={q.h} m={q.m} noHour={lvl0} ring={hint && q.mode !== 'words'} /></div>}
        {!lvl0 && <div class="sky-wrap"><Sky t={h24 + q.m / 60} /></div>}
        {q.mode === 'clock' && <div class={`period ${q.isFm ? 'fm' : 'em'}`}>{q.isFm ? 'Förmiddag' : 'Eftermiddag'}</div>}
        {q.mode === 'choice' ? (
          <div class="choices">
            {q.opts!.map((o, i) => (
              <button key={i} class={`choice${wrong.includes(i) ? ' wrong' : ''}${phase === 'done' && o.tag === 'correct' ? ' right' : ''}`}
                disabled={phase === 'done' || wrong.includes(i)} onClick={() => choose(i)}>{cap(o.text)}</button>
            ))}
          </div>
        ) : (
          <form class="answer-row" onSubmit={(e) => { e.preventDefault(); checkTime(); }}>
            <input ref={inputRef} class="time-input" placeholder="tt:mm" inputMode="decimal" autocomplete="off" aria-label="Tid med siffror"
              value={input} disabled={phase === 'done'} onInput={(e) => { setInput(e.currentTarget.value); setWarn(''); }} />
            {!showNextButton && <button class="btn primary">Rätta</button>}
          </form>
        )}
        {phase === 'done' && q.mode === 'choice' && (
          <p class="explain">{lvl0 ? (q.m === 0 ? 'Minutvisaren på 12:an betyder hel timme.' : `Minutvisaren visar ${q.m} minuter efter hel timme.`) : `Klockan visar ${fmt(h24, q.m)}.`}</p>
        )}
      </>
    );
  }

  return (
    <div class="kq">
      {hint && <p class="hint-tag">💡 {q.mode === 'words' || q.mode === 'between' ? 'Blått = minuter, understruket = timme. ' : ''}{q.mode !== 'words' ? 'Minuterna står runt klockan.' : ''}</p>}
      {body}
      {warn && <p class="warn-line" role="alert">{warn}</p>}
      <p class={`feedback ${phase === 'done' ? 'ok' : 'bad'}`} role="status">{feedback}</p>
      {phase === 'fixing' && err && (
        <div class="errcard shake" key={tries}>
          <div class="err-title">{err.title}</div>
          <div class="err-text">{err.text}</div>
          <div class="err-task">{task}</div>
        </div>
      )}
      {showNextButton && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
    </div>
  );
}
