import { useEffect, useMemo, useState } from 'preact/hooks';
import { dataRev, gate, go, heroId, toast, touch } from '../state';
import { backupDue, cleanName, deleteHero, getMeta, getProfile, listHeroes, markExported, saveProfile, type Profile } from '../platform/profiles';
import { exportAll, importReplace, isDeviceExport, listBackups, restoreBackup } from '../platform/storage/backup';
import { kv } from '../platform/storage/kv';
import { initGate, lockGate } from '../platform/gate/gate';
import { isInstalled, requestPersistentStorage, storageInfo } from '../platform/device';
import { canSpeak, speak, voiceFor, voices } from '../platform/speech';
import { GRADES, gradeName } from '../content/heroes';
import { selectHero } from '../session';
import type { V01Player } from '../platform/legacy/klockaV01';
import { CONSOLE_SNIPPET } from '../platform/legacy/snippet';

import { Avatar, Screen } from './ui';
import { HeroOverview } from './VuxenOversikt';

const legacy = () => import('../platform/legacy/klockaV01');

function AdultCheck({ onPass }: { onPass: () => void }) {
  const [a, b] = useMemo(() => [12 + Math.floor(Math.random() * 8), 12 + Math.floor(Math.random() * 8)], []);
  const [v, setV] = useState('');
  const [wrong, setWrong] = useState(false);
  return (
    <form class="card adult-check" onSubmit={(e) => { e.preventDefault(); if (Number(v) === a * b) onPass(); else { setWrong(true); setV(''); } }}>
      <h1 class="page-title">Vuxenläge</h1>
      <p>För vuxna. Hur mycket är <b>{a} × {b}</b>?</p>
      <input class="big-input" inputMode="numeric" value={v} onInput={(e) => setV(e.currentTarget.value)} autoFocus aria-label="Svar" />
      {wrong && <p class="note warn">Inte riktigt. Försök igen.</p>}
      <div class="row">
        <button type="button" class="btn" onClick={() => go(heroId.value ? 'karta' : 'hjaltar')}>Tillbaka</button>
        <button class="btn primary">Gå in</button>
      </div>
    </form>
  );
}

function HeroAdmin({ p }: { p: Profile }) {
  const [name, setName] = useState(p.name);
  const [confirm, setConfirm] = useState<string | null>(null);
  const save = (patch: Partial<Profile>) => { saveProfile({ ...p, ...patch }); touch(); toast('Sparat'); };
  return (
    <div class="admin-hero">
      <div class="admin-hero-head"><Avatar p={p} size={44} /><b>{p.name}</b></div>
      <label>Namn
        <span class="row">
          <input value={name} maxLength={20} onInput={(e) => setName(e.currentTarget.value)} />
          <button class="btn small" disabled={!cleanName(name) || cleanName(name) === p.name} onClick={() => save({ name: cleanName(name) })}>Spara</button>
        </span>
      </label>
      <label>Årskurs
        <select value={p.grade} onChange={(e) => save({ grade: Number(e.currentTarget.value) })}>
          {GRADES.map((g) => <option key={g} value={g}>{gradeName(g)}</option>)}
        </select>
      </label>
      {confirm === null ? (
        <button class="btn small danger" onClick={() => setConfirm('')}>Radera hjälten…</button>
      ) : (
        <div class="danger-zone">
          <p>Skriv <b>{p.name}</b> för att radera. En säkerhetskopia tas först.</p>
          <span class="row">
            <input value={confirm} onInput={(e) => setConfirm(e.currentTarget.value)} aria-label="Bekräfta namn" />
            <button class="btn small danger" disabled={confirm !== p.name}
              onClick={() => { deleteHero(p.id); if (heroId.value === p.id) selectHero(null); touch(); toast('Hjälten är raderad'); }}>Radera</button>
            <button class="btn small" onClick={() => setConfirm(null)}>Avbryt</button>
          </span>
        </div>
      )}
    </div>
  );
}

function LegacyImport({ heroes }: { heroes: Profile[] }) {
  const [text, setText] = useState('');
  const [found, setFound] = useState<Record<string, V01Player> | null>(null);
  const [target, setTarget] = useState<Record<string, string>>({});
  const [bad, setBad] = useState(false);
  if (!heroes.length) return <p class="muted">Skapa hjältarna först, sedan kan du flytta in deras gamla framsteg.</p>;
  return (
    <>
      <ol class="install">
        <li>Öppna den gamla <b>Klockövning.html</b> på barnets dator, precis som vanligt.</li>
        <li>Tryck <b>F12</b> (Mac: Cmd+Alt+I), välj fliken <b>Console</b>, klistra in raden nedan och tryck Enter. Nu är framstegen kopierade.</li>
        <li>Klistra in här nedanför.</li>
      </ol>
      <div class="snippet">
        <code>{CONSOLE_SNIPPET}</code>
        <button class="btn small" onClick={() => navigator.clipboard?.writeText(CONSOLE_SNIPPET).then(() => toast('Kopierat'))}>Kopiera</button>
      </div>
      <textarea class="paste" rows={3} value={text} placeholder="Klistra in här" aria-label="Inklistrade framsteg"
        onInput={(e) => { setText(e.currentTarget.value); setBad(false); setFound(null); }} />
      <button class="btn small primary" disabled={!text.trim()} onClick={async () => { const f = (await legacy()).parseV01Paste(text); setFound(f); setBad(!f); if (f) setTarget(Object.fromEntries(Object.keys(f).map((n) => [n, heroes.find((h) => h.name.toLowerCase() === n.toLowerCase())?.id ?? heroes[0].id]))); }}>Läs in</button>
      {bad && <p class="note warn">Hittade inga klockframsteg i texten.</p>}
      {found && Object.entries(found).map(([name, data]) => (
        <div class="row legacy-row" key={name}>
          <span><b>{name}</b> ({data.camp?.lvl ? `nivå ${data.camp.lvl}, ` : ''}{Object.values(data.camp?.stages ?? {}).filter((x) => x?.done).length} banor)</span>
          <span>→</span>
          <select value={target[name]} onChange={(e) => setTarget({ ...target, [name]: e.currentTarget.value })} aria-label={`Hjälte för ${name}`}>
            {heroes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <button class="btn small primary" onClick={async () => {
            const { alreadyImported, importV01 } = await legacy();
            const hid = target[name];
            if (alreadyImported(hid, name)) { toast(`${name} är redan inflyttad i den hjälten.`); return; }
            const r = importV01(hid, name, data);
            touch();
            toast(`Klart! ${r.stages} banor, +${r.xp} XP, +${r.kastanjer} kastanjer och en Pionjärkista.`);
          }}>Flytta in</button>
        </div>
      ))}
    </>
  );
}

/** Finns en svensk röst? Stavningsträskets diktamen behöver en; utan den blir det flerval. */
function Upplasning() {
  voices.value;
  const v = voiceFor('sv-SE');
  return (
    <section class="card">
      <h2>Uppläsning</h2>
      {!canSpeak() ? <p class="note warn">Den här webbläsaren kan inte läsa upp text.</p>
        : v ? <p>Svensk röst: <b>{v.name}</b>{!v.localService && ' (hämtas via nätet)'}</p>
          : <p class="note warn">Ingen svensk röst hittades. I Stavningsträsket blir diktamen då flerval i stället.</p>}
      {canSpeak() && <button class="btn small" onClick={() => speak('Hej! Så här låter uppläsningen. Kan du stava till sjöjungfru?')}>🔊 Testa uppläsning</button>}
      <h3>Saknas svensk röst?</h3>
      <ul class="install">
        <li><b>Windows:</b> Inställningar → Tid och språk → Tal → Lägg till röster → Svenska. Starta om webbläsaren efteråt. Syns rösten ändå inte i Chrome, prova Microsoft Edge – den hittar fler röster.</li>
        <li><b>iPad:</b> Inställningar → Hjälpmedel → Uppläst innehåll → Röster → Svenska.</li>
        <li><b>Android:</b> Inställningar → Hjälpmedel → Text till tal → Googles talmotor → Installera röstdata → Svenska.</li>
      </ul>
    </section>
  );
}

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function Vuxen() {
  dataRev.value;
  const [ok, setOk] = useState(false);
  const [info, setInfo] = useState<{ persisted: boolean; usedKB: number | null } | null>(null);
  useEffect(() => { if (ok) storageInfo().then(setInfo); }, [ok]);
  if (!ok) return <Screen class="vuxen"><AdultCheck onPass={() => setOk(true)} /></Screen>;

  const g = gate.value!;
  const heroes = listHeroes();
  const backups = listBackups();
  const meta = getMeta();

  async function importFile(file: File) {
    try {
      const data = JSON.parse(await file.text());
      if (!isDeviceExport(data)) { toast('Det där är ingen Azaleaporten-fil.'); return; }
      importReplace(data);
      selectHero(null);
      touch();
      toast('Säkerhetskopian är återställd');
    } catch {
      toast('Kunde inte läsa filen.');
    }
  }

  return (
    <Screen class="vuxen">
      <header class="topbar">
        <button class="btn" onClick={() => go(heroId.value && getProfile(heroId.value) ? 'karta' : 'hjaltar')}>← Tillbaka</button>
      </header>
      <h1 class="page-title">Vuxenläge</h1>

      {heroes.length > 0 && (
        <section>
          <h2>Hur går det?</h2>
          {heroes.map((p) => <HeroOverview key={p.id} hid={p.id} />)}
        </section>
      )}

      <section class="card">
        <h2>Hjältar på den här enheten</h2>
        {heroes.length === 0 && <p class="muted">Inga hjältar än.</p>}
        {heroes.map((p) => <HeroAdmin key={p.id} p={p} />)}
      </section>

      <section class="card">
        <h2>Porten och familjepaketet</h2>
        <p>
          {!g.packAvailable && 'Inget familjepaket är publicerat ännu. Alla bossar använder de allmänna personorna.'}
          {g.packAvailable && g.pack && `Familjepaketet är upplåst på den här enheten (${g.pack.personas.length} mästare).`}
          {g.packAvailable && !g.pack && 'Familjepaketet är låst på den här enheten.'}
        </p>
        <div class="row">
          {g.packAvailable && !g.pack && <button class="btn primary small" onClick={() => go('porten')}>Lås upp</button>}
          {g.pack && <button class="btn small" onClick={async () => { lockGate(); gate.value = await initGate(); toast('Porten är låst igen på den här enheten'); }}>Lås porten igen</button>}
        </div>
      </section>

      <section class="card">
        <h2>Säkerhetskopia och flytt</h2>
        <p>All data finns bara på den här enheten. Spara en kopia ibland, och använd den för att flytta hjältarna till en annan enhet.</p>
        <p>Senaste nedladdade kopia: <b>{meta.lastExport ? new Date(meta.lastExport).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'ingen än'}</b></p>
        {backupDue() && <p class="note warn">💾 Det är dags att spara en ny säkerhetskopia (vi påminner efter 30 dagar).</p>}
        <div class="row">
          <button class="btn primary small" onClick={() => { download(`azaleaporten-${new Date().toISOString().slice(0, 10)}.json`, exportAll()); markExported(); touch(); }}>Ladda ner säkerhetskopia</button>
          <label class="btn small file-btn">Återställ från fil…
            <input type="file" accept="application/json,.json" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) importFile(f); e.currentTarget.value = ''; }} />
          </label>
        </div>
        <p class="note">Återställning ersätter hjältarna på enheten. En automatisk säkerhetskopia tas först.</p>
        {backups.length > 0 && (
          <>
            <h3>Automatiska säkerhetskopior</h3>
            {backups.slice().reverse().map((k) => {
              const snap = kv.get<{ reason: string; at: string }>(k);
              return (
                <div class="row backup-row" key={k}>
                  <small>{snap ? new Date(snap.at).toLocaleString('sv-SE') : k} – {snap?.reason}</small>
                  <button class="btn small" onClick={() => { restoreBackup(k); selectHero(null); touch(); toast('Återställd'); }}>Återställ</button>
                </div>
              );
            })}
          </>
        )}
      </section>

      <section class="card">
        <h2>Lagring</h2>
        {!kv.isPersistent() && <p class="note warn">Webbläsaren tillåter inte lagring just nu (privat läge?). Inget sparas!</p>}
        <p>
          Beständig lagring: <b>{info?.persisted ? 'ja' : 'nej'}</b>
          {info?.usedKB != null && <> · använt ca {info.usedKB} kB</>}
        </p>
        {!info?.persisted && (
          <button class="btn small" onClick={async () => { const okP = await requestPersistentStorage(); toast(okP ? 'Lagringen är nu beständig' : 'Webbläsaren sa nej – installera appen på hemskärmen'); storageInfo().then(setInfo); }}>
            Be om beständig lagring
          </button>
        )}
        <p class="note">Om minnet blir fullt rensas först gamla automatiska säkerhetskopior och sedan den äldsta statistiken. Framsteg, stjärnor och saker rensas aldrig.</p>
        <h3>Installera som app (rekommenderas)</h3>
        {isInstalled() && <p class="note">✓ Appen är installerad på den här enheten.</p>}
        <ul class="install">
          <li><b>iPad/iPhone (Safari):</b> Dela-knappen → "Lägg till på hemskärmen". Viktigt – annars kan Safari rensa sparad data efter en vecka utan besök.</li>
          <li><b>Android (Chrome):</b> menyn ⋮ → "Installera app" / "Lägg till på startskärmen".</li>
          <li><b>Dator (Chrome/Edge):</b> installera-ikonen i adressfältet.</li>
        </ul>
      </section>

      <Upplasning />

      <section class="card">
        <h2>Flytta in från gamla Klockövning</h2>
        <LegacyImport heroes={heroes} />
      </section>

      <p class="version">Version {__APP_VERSION__}</p>
    </Screen>
  );
}
