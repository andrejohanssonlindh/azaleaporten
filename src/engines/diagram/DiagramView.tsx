import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameModule, QuestionViewProps } from '../../platform/rpg/types';
import { canSpeak, hasVoice, speak, voices } from '../../platform/speech';
import { fmtNum, parseAnswer } from '../drill/check';
import { honest, lagat } from './chart';
import { diagnoseAny, errLabel, explainAny, isRight, joinVals, splitVals } from './check';
import { ChartView, PlockBild } from './ChartView';
import type { DiagramGame, DiagramQ, Explained } from './types';

// En diagramfråga. Samma flöde som drill- och ordfrågorna: öppen → (fel) rätta → klar.
// Bara första svaret räknas; ett fel måste rättas. Ett skrivet tal och ett byggt diagram visas efter
// tre försök; vid val och tryck hittar barnet själv rätt bland det som är kvar.
// Motorn har en egen sifferruta och egna knappar (med drill- och ordmotorns stil), så att en fråga kan
// blanda diagram med läsa, välja, trycka och bygga.

type Phase = 'open' | 'fixing' | 'done';

export function makeDiagramView<Q extends DiagramQ>(g: DiagramGame<Q>) {
  return function DiagramView({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
    const q = raw as Q;
    voices.value; // rita om när enhetens röster har laddats
    const [phase, setPhase] = useState<Phase>('open');
    const [tries, setTries] = useState(0);
    const [err, setErr] = useState<Explained | null>(null);
    const [input, setInput] = useState('');
    const [wrong, setWrong] = useState<string[]>([]);
    const [warn, setWarn] = useState('');
    const [vals, setVals] = useState<number[]>(() => q.chart.kat.map(() => q.chart.axel.min));
    // laga: var axeln börjar, eller staplarnas bredd, som barnet har ställt in.
    const [start, setStart] = useState(() => q.chart.lur?.axelStart ?? 0);
    const [bredd, setBredd] = useState<number[]>(() => q.chart.lur?.bredd ?? q.chart.kat.map(() => 1));
    const t0 = useRef(performance.now());
    const inputRef = useRef<HTMLInputElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    useEffect(() => { if (q.kind === 'las') inputRef.current?.focus({ preventScroll: true }); }, [tries]);
    useEffect(() => { if (phase === 'done') nextRef.current?.focus({ preventScroll: true }); }, [phase]);

    function check(given: string) {
      if (phase === 'done') return;
      setWarn('');
      const correct = isRight(q, given);
      const tag = correct ? undefined : diagnoseAny(g, q, given);
      if (phase === 'open') onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
      if (correct) { setPhase('done'); return; }
      if (q.kind === 'val' || q.kind === 'sant' || q.kind === 'tryck') setWrong((w) => [...w, given]);
      setPhase('fixing');
      setTries((n) => n + 1);
      setErr(explainAny(g, tag!, q, given));
      setInput('');
    }

    function submitNumber() {
      const n = parseAnswer(input);
      if (n === null) { setWarn('Skriv svaret med siffror.'); return; }
      check(String(n));
    }

    function setVal(i: number, v: number) {
      setVals((old) => old.map((x, k) => (k === i ? v : x)));
      setWarn('');
    }

    const done = phase === 'done';
    const wasWrong = tries > 0;
    const shows = q.kind === 'las' || q.kind === 'bygg' || q.kind === 'laga';
    const lagaGiven = q.laga === 'axel' ? `a:${start}` : `b:${bredd.join(',')}`;
    const lagad = q.kind === 'laga' ? (done ? honest(q.chart) : lagat(q.chart, lagaGiven)) : q.chart;
    const next = () => onDone(wasWrong ? (tries >= 3 && shows ? 'shown' : 'self') : undefined);
    const feedback = done ? (wasWrong ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
    const task = q.kind === 'val' || q.kind === 'sant' ? 'Välj ett annat alternativ.'
      : q.kind === 'tryck' ? 'Tryck någon annanstans.'
        : q.kind === 'bygg' ? (tries >= 3 ? 'Så här ska det se ut. Bygg likadant för att gå vidare.' : 'Ändra och rätta igen.')
          : q.kind === 'laga' ? (tries >= 3 ? (q.laga === 'axel' ? 'Låt axeln börja på 0 och rätta igen.' : 'Gör alla staplar lika breda och rätta igen.') : 'Ändra och rätta igen.')
          : tries >= 3 ? `Rätt svar är ${q.answer}. Skriv in det för att gå vidare.` : 'Rätta svaret för att gå vidare.';
    const speakable = canSpeak() && hasVoice('sv-SE');

    return (
      <div class="kq diagram">
        {hint && <p class="hint-tag">💡 {g.hint(q)}</p>}
        <div class="ord-head">
          <p class="drill-prompt">{q.prompt}</p>
          {speakable && <button type="button" class="speak" onClick={() => speak(q.prompt)} aria-label="Läs upp">🔊</button>}
        </div>

        {q.rubrik && <p class="dia-rubrik">{q.rubrik}</p>}
        {q.kalla && !q.bredvid && <ChartView chart={q.kalla} />}
        {q.bild && <PlockBild bild={q.bild} label={q.chart.titel} />}

        {q.chart.kat.length > 0 && <div class={q.bredvid ? 'dia-bredvid' : undefined}>
          {q.kalla && q.bredvid && <ChartView chart={q.kalla} />}
          {q.kind === 'bygg'
            ? <ChartView chart={q.chart} vals={done ? splitVals(q.answer) : vals} edit={done ? undefined : setVal} showVals={done && vals.length > 0 && (q.chart.typ === 'stapel' || q.chart.typ === 'linje')} />
            : q.kind === 'laga'
              ? <ChartView chart={lagad} onTap={q.laga === 'bredd' && !done ? (part) => { const i = Number(part.slice(1)); if (part.startsWith('k')) setBredd((b) => b.map((x, k) => (k === i ? 1 : x))); } : undefined} />
              : <ChartView chart={q.chart} onTap={q.kind === 'tryck' && !done ? check : undefined} off={q.kind === 'tryck' ? wrong : undefined}
                hit={done ? q.visa : undefined} showVals={done && (q.chart.typ === 'stapel' || q.chart.typ === 'linje') && !q.chart.lur} />}
        </div>}

        {q.kind === 'laga' && !done && q.laga === 'axel' && (
          <div class="dia-laga" role="group" aria-label="Var axeln börjar">
            <span>Axeln börjar på <b>{fmtNum(start)}</b></span>
            <button type="button" class="btn small" aria-label="Flytta ner axelns början" disabled={start <= 0} onClick={() => setStart((x) => Math.max(0, x - q.chart.axel.steg))}>▼</button>
            <button type="button" class="btn small" aria-label="Flytta upp axelns början" disabled={start >= q.chart.axel.max - 2 * q.chart.axel.steg} onClick={() => setStart((x) => x + q.chart.axel.steg)}>▲</button>
          </div>
        )}
        {q.kind === 'laga' && !done && q.laga === 'bredd' && (
          <div class="dia-laga">
            <span>Tryck på en stapel som är för bred, så blir den vanlig.</span>
            <button type="button" class="btn small" onClick={() => setBredd(q.chart.lur?.bredd ?? q.chart.kat.map(() => 1))}>Börja om</button>
          </div>
        )}
        {q.kind === 'laga' && !done && (
          <div class="row center-row"><button type="button" class="btn primary" onClick={() => check(lagaGiven)}>Rätta</button></div>
        )}

        {done && q.sanning && q.chart.lur && q.kind !== 'laga' && (
          <div class="dia-facit dia-sanning"><p class="dia-sanning-rubrik">🔍 Sanningen</p><ChartView chart={honest(q.chart)} showVals={q.chart.typ !== 'cirkel'} /></div>
        )}

        {q.kind === 'bygg' && phase === 'fixing' && tries >= 3 && (
          <div class="dia-facit"><ChartView chart={{ ...q.chart, titel: 'Så här ska det se ut' }} showVals /></div>
        )}

        {q.kind === 'las' && !done && (
          <form class="eq-form" onSubmit={(e) => { e.preventDefault(); submitNumber(); }}>
            <div class="eq">
              <input ref={inputRef} class="eq-input" inputMode={/[.,]/.test(q.answer) ? 'decimal' : 'numeric'} autocomplete="off" aria-label="Ditt svar"
                value={input} onInput={(e) => { setInput(e.currentTarget.value); setWarn(''); }} />
              {q.enhet && <span class="eq-unit">{q.enhet}</span>}
            </div>
            <div class="row center-row"><button class="btn primary">Rätta</button></div>
          </form>
        )}
        {q.kind === 'las' && done && <p class="eq"><span class="eq-ans">{q.answer}</span>{q.enhet && <span class="eq-unit">{q.enhet}</span>}</p>}

        {(q.kind === 'val' || q.kind === 'sant') && !done && (
          <div class={q.alts!.some((a) => a.text.length > 16) ? 'choices' : 'drill-choices words'} role="group" aria-label="Välj svar">
            {q.alts!.map((a) => {
              const off = wrong.includes(a.text);
              const long = q.alts!.some((x) => x.text.length > 16);
              return (
                <button key={a.text} type="button" class={`${long ? 'choice' : 'btn drill-choice'}${off ? ' wrong' : ''}`} disabled={off} onClick={() => check(a.text)}>{a.text}</button>
              );
            })}
          </div>
        )}

        {q.kind === 'bygg' && !done && (
          <div class="row center-row"><button type="button" class="btn primary" onClick={() => check(joinVals(vals))}>Rätta</button></div>
        )}

        {warn && <p class="warn-line" role="alert">{warn}</p>}
        <p class={`feedback ${done ? 'ok' : 'bad'}`} role="status">{feedback}</p>
        {phase === 'fixing' && err && (
          <div class="errcard shake" key={tries}>
            <div class="err-title">{err.title}</div>
            <div class="err-text">{err.text}</div>
            <div class="err-task">{task}</div>
          </div>
        )}
        {done && <p class="explain">{g.solution(q)}</p>}
        {done && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
      </div>
    );
  };
}

/** Gör ett diagramspel till en frågefabrik för plattformen. */
export function diagramModule<Q extends DiagramQ>(g: DiagramGame<Q>): GameModule {
  return {
    id: g.id,
    makeQuestion: (spec, rng, ctx) => g.make(spec, rng, ctx),
    skillOf: (q) => (q as Q).skill,
    specsForSkill: (s) => g.specsForSkill(s),
    errLabel: (tag) => errLabel(g as unknown as DiagramGame<DiagramQ>, tag),
    View: makeDiagramView(g),
    lessons: g.lessons,
  };
}
