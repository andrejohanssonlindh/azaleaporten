import { useState } from 'preact/hooks';
import { START_ANIMALS, CLASSES, COLORS, GRADES, gradeName, heroClass, type AnimalId, type ClassId, type ColorId } from '../content/heroes';
import { cleanName, createHero, listHeroes, NAME_MAX, nameTaken } from '../platform/profiles';
import { requestPersistentStorage } from '../platform/device';
import { go, touch } from '../state';
import { selectHero } from '../session';
import { Avatar, Screen } from './ui';
import { HamtaHjalte, playLoaded } from './HjalteFil';

const STEPS = ['namn', 'djur', 'farg', 'klass', 'arskurs', 'klar'] as const;

export function NewHero() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [animal, setAnimal] = useState<AnimalId>('rav');
  const [color, setColor] = useState<ColorId>('azalea');
  const [cls, setCls] = useState<ClassId>('riddare');
  const [grade, setGrade] = useState<number | null>(null);

  const clean = cleanName(name);
  const canNext = [clean.length > 0, true, true, true, grade !== null, true][step];
  const next = () => { if (canNext) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => (step === 0 ? go(listHeroes().length ? 'hjaltar' : 'porten') : setStep(step - 1));

  function finish() {
    const p = createHero({ name: clean, animal, color, heroClass: cls, grade: grade ?? 3 });
    requestPersistentStorage();
    selectHero(p.id);
    touch();
    go('karta');
  }

  const preview = { animal, color };

  return (
    <Screen class="wizard">
      <div class="steps" aria-label={`Steg ${step + 1} av ${STEPS.length}`}>
        {STEPS.map((s, i) => <span key={s} class={`step-dot${i <= step ? ' on' : ''}`} />)}
      </div>

      {step === 0 && (
        <form onSubmit={(e) => { e.preventDefault(); next(); }}>
          <h1 class="page-title">Vad heter du, hjälte?</h1>
          <input class="big-input" value={name} maxLength={NAME_MAX} autoFocus autocomplete="off" aria-label="Ditt namn"
            onInput={(e) => setName(e.currentTarget.value)} placeholder="Skriv ditt namn" />
          {nameTaken(name) && <p class="note warn">Det finns redan en hjälte som heter {clean} här. Det går bra, men kanske lägga till något?</p>}
          <p class="note">Ditt namn sparas bara på den här enheten.</p>
          <div class="row center-row load-hero">
            <span class="muted">Har du redan en hjälte i en fil?</span>
            <HamtaHjalte onDone={playLoaded} />
          </div>
        </form>
      )}

      {step === 1 && (
        <>
          <h1 class="page-title">Välj ditt djur</h1>
          <div class="choice-grid animals">
            {START_ANIMALS.map((a) => (
              <button key={a.id} class={`pick${animal === a.id ? ' on' : ''}`} onClick={() => setAnimal(a.id)} aria-pressed={animal === a.id}>
                <span class="pick-emoji">{a.emoji}</span><small>{a.name}</small>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 class="page-title">Välj din färg</h1>
          <div class="center"><Avatar p={preview} size={110} /></div>
          <div class="choice-grid colors">
            {COLORS.map((c) => (
              <button key={c.id} class={`swatch${color === c.id ? ' on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.id)}
                aria-pressed={color === c.id} aria-label={c.name} title={c.name} />
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 class="page-title">Vilken sorts hjälte är du?</h1>
          <div class="class-list">
            {CLASSES.map((c) => (
              <button key={c.id} class={`class-card${cls === c.id ? ' on' : ''}`} onClick={() => setCls(c.id)} aria-pressed={cls === c.id}>
                <span class="class-emoji">{c.emoji}</span>
                <span class="class-text"><b>{c.name}</b><small>{c.flavor}</small><span class="perk">{c.perk}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h1 class="page-title">Vilken årskurs går du i?</h1>
          <div class="choice-grid grades">
            {GRADES.map((g) => (
              <button key={g} class={`pick grade${grade === g ? ' on' : ''}`} onClick={() => setGrade(g)} aria-pressed={grade === g}>
                <span class="pick-emoji">{g === 0 ? 'F' : g}</span>
              </button>
            ))}
          </div>
          <p class="note">Det hjälper Mästare Kastanj att välja lagom svåra äventyr. Du kan ändå gå vart du vill.</p>
        </>
      )}

      {step === 5 && (
        <div class="hero-reveal">
          <Avatar p={preview} size={140} />
          <h1 class="page-title">{clean}</h1>
          <p class="reveal-sub">{heroClass(cls).emoji} {heroClass(cls).name} · {gradeName(grade ?? 3)}</p>
          <p class="note">{heroClass(cls).flavor}</p>
        </div>
      )}

      <nav class="wizard-nav">
        <button class="btn" onClick={back}>Tillbaka</button>
        {step < STEPS.length - 1
          ? <button class="btn primary" onClick={next} disabled={!canNext}>Nästa</button>
          : <button class="btn primary big" onClick={finish}>Kliv in i riket!</button>}
      </nav>
    </Screen>
  );
}
