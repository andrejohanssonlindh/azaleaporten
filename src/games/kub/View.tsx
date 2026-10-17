import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { QuestionViewProps } from '../../platform/rpg/types';
import { BITAR, FARGNAMN, dragBas, dragVarv, invDrag, visa, vrid, type Drag } from '../../engines/kub/kub';
import { delDrag, los, stegNu } from '../../engines/kub/losning';
import { DragKnappar, DragRad, Kub3D, ToppBild, useSpelare } from '../../engines/kub/Kub3D';
import { STEGNAMN, diagnosDrag, diagnosLosa, explainKub, hintKub, klart, type Forklaring, type KubQ } from './logic';

// En kubfråga. Samma flöde som de andra spelen: öppen → (fel) rätta → klar, och bara första svaret räknas.

type Phase = 'open' | 'fixing' | 'done';

export function KubView({ q: raw, hint, onAnswer, onDone, nextLabel = 'Nästa' }: QuestionViewProps) {
  const q = raw as KubQ;
  const [phase, setPhase] = useState<Phase>('open');
  const [tries, setTries] = useState(0);
  const [err, setErr] = useState<Forklaring | null>(null);
  const [shown, setShown] = useState(false);
  const [wrong, setWrong] = useState<(number | string)[]>([]);
  const [pos, setPos] = useState(0);
  const [halv, setHalv] = useState<Drag | null>(null);
  const [visaAlg, setVisaAlg] = useState(!q.dold);
  const [gjorda, setGjorda] = useState<Drag[]>([]);
  const [tips, setTips] = useState('');
  // Medan ett fel visas och tas tillbaka går det inte att trycka.
  const [lasta, setLasta] = useState(false);
  const klarRef = useRef(false);
  const sp = useSpelare(q.start);
  const t0 = useRef(performance.now());
  const answered = useRef(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const done = phase === 'done';

  useEffect(() => { if (done) nextRef.current?.focus({ preventScroll: true }); }, [done]);
  // vilket: draget visas direkt.
  useEffect(() => {
    if (q.kind !== 'vilket') return;
    const t = window.setTimeout(() => sp.spela([q.drag!], { ms: 650 }), 600);
    return () => clearTimeout(t);
  }, []);

  function first(correct: boolean, tag?: string) {
    if (answered.current) return;
    answered.current = true;
    onAnswer({ correct, ms: Math.round(performance.now() - t0.current), errTag: tag, hint });
  }
  function miss(tag: string) {
    setPhase('fixing');
    setTries((n) => n + 1);
    setErr(explainKub(tag, q));
  }
  function klar() { first(true); setErr(null); setPhase('done'); }

  // ----- gor: följ kubprogrammet -----
  const alg = q.alg ?? [];
  function gorDrag(m: Drag) {
    if (done || lasta || pos >= alg.length) return;
    const e = alg[pos];
    const fortsatt = (nyPos: number, nyHalv: Drag | null) => {
      setPos(nyPos); setHalv(nyHalv); setErr(null);
      sp.spela([m], { then: nyPos >= alg.length ? klar : undefined });
    };
    if (dragVarv(e) === 2 && dragBas(m) === dragBas(e) && dragVarv(m) !== 2) {
      if (!halv) return fortsatt(pos, m);
      if (m === halv) return fortsatt(pos + 1, null);
    } else if (m === e) return fortsatt(pos + 1, null);
    // Fel: draget görs och tas tillbaka, så att barnet ser vad det blev.
    const tag = diagnosDrag(e, m);
    first(false, tag);
    setVisaAlg(true);
    setLasta(true);
    sp.spela([m, invDrag(m)], { ms: 420, then: () => { setLasta(false); miss(tag); } });
  }

  // ----- losa: vrid fritt mot målet -----
  function losaDrag(m: Drag) {
    if (done || shown || klarRef.current) return;
    const ny = [...gjorda, m];
    setGjorda(ny);
    setErr(null);
    setTips('');
    // Målet kollas direkt när knappen trycks, så att snabba tryck efteråt inte vrider bort en löst kub.
    if (klart(q, vrid(sp.logisk(), m))) {
      klarRef.current = true;
      sp.spela([m], { then: klar });
      return;
    }
    sp.spela([m], {
      then: () => {
        if (q.maxDrag && ny.length > q.maxDrag) {
          first(false, 'for-manga-drag');
          miss('for-manga-drag');
          sp.satt(q.start);
          setGjorda([]);
        }
      },
    });
  }
  const angra = () => {
    if (!gjorda.length || sp.upptagen) return;
    const m = gjorda[gjorda.length - 1];
    setGjorda(gjorda.slice(0, -1));
    sp.spela([invDrag(m)]);
  };
  const borjaOm = () => { sp.satt(q.start); setGjorda([]); setErr(null); };
  function provaKlar() {
    if (done || sp.upptagen) return;
    const k = sp.logisk();
    const tag = diagnosLosa(q, k, gjorda);
    first(false, tag);
    miss(tag);
  }
  function visaLosning() {
    setShown(true); setErr(null);
    sp.satt(q.start); setGjorda([]);
    sp.spela(q.losning ?? [], { ms: 420, then: () => setPhase('done') });
  }
  function nastaTips() {
    const k = sp.logisk();
    const d = los(k).find((x) => delDrag(x).length);
    if (!d) return;
    setTips(`${STEGNAMN[d.steg]}: prova ${visa(delDrag(d)[0])}`);
  }

  // ----- vilket, valj och bit -----
  function valj(i: number) {
    if (done || wrong.includes(i) || sp.upptagen) return;
    const a = q.alts![i];
    first(!a.err, a.err);
    if (!a.err) { setWrong((w) => [...w, `ok${i}`]); setPhase('done'); setErr(null); return; }
    setWrong((w) => [...w, i]);
    miss(a.err);
  }
  function tryck(p: number) {
    if (done || wrong.includes(p)) return;
    if (q.ratt!.includes(p)) { first(true); setPhase('done'); setErr(null); return; }
    const tag = q.fel?.[p] ?? 'fel-plats';
    first(false, tag);
    setWrong((w) => [...w, p]);
    miss(tag);
  }

  const next = () => onDone(tries > 0 ? (shown ? 'shown' : 'self') : undefined);
  const feedback = done ? (shown ? '' : tries > 0 ? 'Rätt! Nu stämmer det.' : 'Rätt! Bra jobbat!') : phase === 'fixing' ? (tries > 1 ? 'Fortfarande fel' : 'Fel') : '';
  const task = q.kind === 'gor' ? 'Fortsätt med rätt drag.' : q.kind === 'losa' ? 'Fortsätt vrida, eller tryck Ångra.' : q.kind === 'bit' ? 'Tryck på en annan bit.' : 'Välj ett annat svar.';

  const rattBit = done && q.kind === 'bit' ? BITAR.find((b) => b.platser.includes(q.ratt![0]))!.platser : undefined;
  const markera = rattBit ?? (q.kind === 'losa' && done ? undefined : q.markera);
  const nu = useMemo(() => (q.hela && !done ? stegNu(sp.visad) : null), [sp.visad, done]);

  return (
    <div class="kq kub">
      {hint && <p class="hint-tag">💡 {hintKub(q)}</p>}
      <p class="drill-prompt">{q.prompt}</p>
      {q.fargprick && (
        <p class="kub-farger" aria-hidden="true">{q.fargprick.map((f) => <span key={f} class={`kub-prick f-${f}`} title={FARGNAMN[f]} />)}</p>
      )}
      {q.kind === 'gor' && <DragRad alg={alg} klara={pos} dold={!visaAlg} grupp={q.grupp} />}
      {q.kind === 'losa' && q.alg && <DragRad alg={q.alg} label="Programmet som blandade kuben" />}
      {nu && nu !== 'klar' && <p class="kub-steg">Steg: <b>{STEGNAMN[nu]}</b></p>}

      <div class="kub-scen">
        <Kub3D kub={sp.visad} anim={sp.anim} onAnimEnd={sp.slut} label="Rubiks kub. Dra för att titta runt."
          onTryck={q.kind === 'bit' && !done ? tryck : undefined} markera={markera} fel={q.kind === 'bit' ? wrong.filter((w): w is number => typeof w === 'number') : undefined} />
        {(q.underifran || q.topp) && (
          <div class="kub-sido">
            {q.underifran && <figure><Kub3D kub={sp.visad} vy="ner" s={24} label="Kuben underifrån" /><figcaption>Underifrån</figcaption></figure>}
            {q.topp && <ToppBild kub={sp.visad} text="Ovanifrån" />}
          </div>
        )}
      </div>

      {(q.kind === 'gor' || q.kind === 'losa') && !done && (
        <DragKnappar onDrag={q.kind === 'gor' ? gorDrag : losaDrag} disabled={shown || lasta} rotera={q.rotera} />
      )}
      {q.kind === 'gor' && halv && !done && <p class="note">Ett halvt varv: en gång till åt samma håll!</p>}

      {q.kind === 'losa' && !done && !shown && (
        <div class="row center-row kub-kontroll">
          <button type="button" class="btn small" disabled={!gjorda.length || sp.upptagen} onClick={angra}>↶ Ångra</button>
          <button type="button" class="btn small" disabled={!gjorda.length} onClick={borjaOm}>↺ Börja om</button>
          {q.hela ? <button type="button" class="btn small" onClick={nastaTips}>💡 Nästa drag</button>
            : <button type="button" class="btn primary" disabled={sp.upptagen} onClick={provaKlar}>Klar!</button>}
        </div>
      )}
      {tips && <p class="kub-tips" role="status">{tips}</p>}
      {q.kind === 'losa' && q.maxDrag && !done && !shown && <p class="note kub-rakna">Drag: {gjorda.length} av högst {q.maxDrag}</p>}
      {q.kind === 'losa' && !done && !shown && tries >= 2 && (
        <div class="row center-row"><button type="button" class="link" onClick={visaLosning}>Visa lösningen</button></div>
      )}

      {q.kind === 'vilket' && (
        <div class="row center-row"><button type="button" class="btn small" disabled={sp.upptagen} onClick={() => { sp.satt(q.start); window.setTimeout(() => sp.spela([q.drag!], { ms: 650 }), 120); }}>▶ Visa draget igen</button></div>
      )}
      {(q.kind === 'vilket' || q.kind === 'valj') && (
        <div class={`drill-choices words${q.kind === 'vilket' ? ' kub-val' : ''}`} role="group" aria-label="Välj svar">
          {q.alts!.map((a, i) => {
            const off = wrong.includes(i);
            const ok = wrong.includes(`ok${i}`);
            return <button key={i} type="button" class={`btn drill-choice${off ? ' wrong' : ''}${ok ? ' right' : ''}`} disabled={off || done} onClick={() => valj(i)}>{q.kind === 'vilket' ? visa(a.label) : a.label}</button>;
          })}
        </div>
      )}

      <p class={`feedback ${done ? 'ok' : 'bad'}`} role="status">{sp.upptagen ? '' : feedback}</p>
      {phase === 'fixing' && err && !sp.upptagen && (
        <div class="errcard shake" key={tries}>
          <div class="err-title">{err.title}</div>
          <div class="err-text">{err.text}</div>
          <div class="err-task">{task}</div>
        </div>
      )}
      {done && shown && <p class="explain">Så här kan man göra. Prova själv nästa gång!</p>}
      {done && !sp.upptagen && <button ref={nextRef} class="btn primary big next-btn" onClick={next}>{nextLabel}</button>}
    </div>
  );
}
