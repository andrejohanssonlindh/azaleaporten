import { useState } from 'preact/hooks';
import { dataRev, go, toast, touch } from '../state';
import { getProfile } from '../platform/profiles';
import { applyBundle, bundleHero, compareBundle, readBundle, type HeroBundle } from '../platform/storage/heroBundle';
import { selectHero } from '../session';
import { download, fileSafe, readJson, today } from './fil';

// Hjältefilen: barnet sparar sin hjälte i en fil och kan hämta tillbaka den, på samma eller en annan enhet.

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'aldrig');

export function saveHeroFile(hid: string) {
  const b = bundleHero(hid);
  download(`azaleaporten-${fileSafe(b.name)}-${today()}.json`, b);
  touch();
}

/** Kortet i Azaleagården: spara hjälten i en fil. */
export function SparaHjalte({ hid }: { hid: string }) {
  dataRev.value;
  const p = getProfile(hid);
  if (!p) return null;
  return (
    <section class="card save-hero">
      <h2>💾 Spara din hjälte</h2>
      <p>Spara {p.name} i en fil. Med filen kan du hämta tillbaka hjälten om något försvinner, eller ta med den till en annan dator.</p>
      <div class="row center-row">
        <button class="btn primary" onClick={() => { saveHeroFile(hid); toast('Hjälten är sparad i en fil'); }}>Spara i en fil</button>
      </div>
      <p class="note">Senast sparad: {day(p.lastSavedAt)}</p>
    </section>
  );
}

/** Knapp som väljer en hjältefil, och rutan som frågar innan den läggs in. */
export function HamtaHjalte({ card = false, onDone }: { card?: boolean; onDone?: (hid: string) => void }) {
  const [b, setB] = useState<HeroBundle | null>(null);

  async function pick(file: File) {
    const x = readBundle(await readJson(file));
    if (!x) { toast('Det där är ingen hjältefil.'); return; }
    if (compareBundle(x).status === 'ny') put(x); else setB(x);
  }

  function put(x: HeroBundle) {
    try {
      const p = applyBundle(x);
      setB(null);
      touch();
      toast(`${p.name} är tillbaka!`);
      onDone?.(p.id);
    } catch {
      toast('Det gick inte att hämta hjälten. Fråga en vuxen.');
    }
  }

  const input = <input type="file" accept="application/json,.json" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) pick(f); e.currentTarget.value = ''; }} />;
  const c = b && compareBundle(b);

  return (
    <>
      {card
        ? <label class="hero-card new file-btn"><span class="plus" aria-hidden="true">📂</span><b>Hämta hjälte</b>{input}</label>
        : <label class="btn small file-btn">Hämta hjälte från fil…{input}</label>}
      {b && c && (
        <div class="modal" onClick={(e) => { if (e.target === e.currentTarget) setB(null); }}>
          <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Hämta hjälte">
            <h2>{b.name} finns redan här</h2>
            <p>I filen: nivå <b>{b.level}</b>, sparad {day(b.savedAt)}.</p>
            <p>Här nu: nivå <b>{c.here!.level}</b>, senast spelad {day(c.here!.changedAt)}.</p>
            {c.status === 'äldre'
              ? <p class="note warn">Hjälten här har spelat efter att filen sparades. Hämtar du filen försvinner det som hänt sedan dess.</p>
              : <p class="note">Hjälten i filen ersätter den som finns här.</p>}
            <div class="row center-row">
              <button class={`btn ${c.status === 'äldre' ? 'danger' : 'primary'}`} onClick={() => put(b)}>{c.status === 'äldre' ? 'Hämta ändå' : 'Hämta'}</button>
              <button class="btn" onClick={() => setB(null)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Väljer hjälten och går till kartan (efter hämtning från hjälteväljaren). */
export function playLoaded(hid: string) { selectHero(hid); go('karta'); }
