import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { animal, color, heroClass } from '../content/heroes';
import type { Profile } from '../platform/profiles';
import { getHeroState } from '../platform/profiles';
import { applyUpdate, canSpeak, forceUpdate, latestVersion, speak, updateReady } from '../platform/device';
import { hasNewerData } from '../platform/storage/record';
import { go } from '../state';
import { streakOf } from '../platform/learning/quests';

export function Avatar({ p, size = 56 }: { p: Pick<Profile, 'animal' | 'color'>; size?: number }) {
  return (
    <span class="avatar" style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.58)}px`, background: color(p.color).hex }} aria-hidden="true">
      {animal(p.animal).emoji}
    </span>
  );
}

export function TopBar({ p }: { p: Profile }) {
  const s = getHeroState(p.id);
  return (
    <header class="topbar">
      <button class="hero-chip" onClick={() => go('gard')} aria-label={`${p.name}s hjälteblad`}>
        <Avatar p={p} size={40} />
        <span class="hero-chip-text">
          <b>{p.name}</b>
          <small>{s.title ?? heroClass(p.heroClass).name} · Nivå {s.level}</small>
        </span>
      </button>
      <span class="row purses">
        {streakOf(p.id) > 0 && <span class="purse" title="Dagar i rad med alla uppdrag klara">🔥 {streakOf(p.id)}</span>}
        {s.nycklar > 0 && <button class="purse" title="Spelnycklar: gör ett minispel till en skattrunda" onClick={() => go('spelon')}>🗝️ {s.nycklar}</button>}
        <span class="purse" title="Kastanjer">🌰 {s.kastanjer}</span>
      </span>
    </header>
  );
}

/** Ny version / nyare data: visas bara på lugna skärmar (karta, hjälteväljare), aldrig mitt i en runda. */
export function UpdateBanner() {
  if (hasNewerData()) {
    return (
      <div class="banner warn" role="status">
        <span>Den här enheten har sparat med en nyare version. Uppdatera så att inget går förlorat.</span>
        <button class="btn small" onClick={applyUpdate}>Uppdatera</button>
      </div>
    );
  }
  if (!updateReady.value) return null;
  return (
    <div class="banner" role="status">
      <span>✨ En ny version av Azaleaporten finns!</span>
      <button class="btn small primary" onClick={applyUpdate}>Uppdatera</button>
    </div>
  );
}

/** "Hämta senaste versionen": frågar webben vilken version som finns och tvingar fram den.
 *  Fungerar även när "Uppdatera"-rutan inte gör något, och i mobilen där man inte kan ladda om sidan. */
export function UpdateCheck() {
  const [st, setSt] = useState<'idle' | 'checking' | 'same' | 'offline' | 'updating'>('idle');
  const run = async (always: boolean) => {
    setSt('checking');
    const latest = await latestVersion();
    if (latest == null) { setSt('offline'); return; }
    if (latest === __APP_VERSION__ && !always) { setSt('same'); return; }
    setSt('updating');
    if ((await forceUpdate()) === 'offline') setSt('offline');
  };
  return (
    <section class="card update-check">
      <div class="row">
        <button class="btn small" disabled={st === 'checking' || st === 'updating'} onClick={() => run(false)}>🔄 Hämta senaste versionen</button>
        {st === 'same' && <button class="btn small" onClick={() => run(true)}>Ladda om ändå</button>}
      </div>
      <p class="note" role="status">
        {st === 'idle' && 'Har det kommit något nytt? Tryck här, så hämtas det.'}
        {st === 'checking' && 'Kollar …'}
        {st === 'same' && '✓ Du har redan den senaste versionen.'}
        {st === 'offline' && 'Det går inte att nå internet just nu. Försök igen sen!'}
        {st === 'updating' && 'Hämtar den nya versionen …'}
      </p>
      <p class="version">Version {__APP_VERSION__}</p>
    </section>
  );
}

export function Mentor({ text, children, compact = false, who = 'Mästare Kastanj', face = '🌰' }: { text: string; children?: ComponentChildren; compact?: boolean; who?: string; face?: string }) {
  return (
    <section class={`mentor${compact ? ' compact' : ''}`}>
      <div class="mentor-face" aria-hidden="true">{face}</div>
      <div class="mentor-bubble">
        <div class="mentor-name">{who}</div>
        <p>{text}</p>
        {children}
        {canSpeak() && (
          <button class="speak" onClick={() => speak(text)} aria-label="Läs upp">🔊</button>
        )}
      </div>
    </section>
  );
}

export function Screen({ children, class: cls = '' }: { children: ComponentChildren; class?: string }) {
  return <main class={`screen ${cls}`}>{children}</main>;
}

/** Tillbaka-rad överst på undersidor. */
export function BackBar({ label, to, right }: { label: string; to: string; right?: ComponentChildren }) {
  return (
    <header class="topbar">
      <button class="btn" onClick={() => go(to)}>← {label}</button>
      {right}
    </header>
  );
}

export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return <span class="stars" aria-label={`${n} av ${of} stjärnor`}>{'★'.repeat(n)}<span class="stars-off">{'☆'.repeat(of - n)}</span></span>;
}

/** Porträtt: emoji eller bild (familjepaketets porträtt är data-URL:er). */
export function Portrait({ src, size = 96 }: { src: string; size?: number }) {
  if (src.startsWith('data:')) return <img class="portrait" src={src} width={size} height={size} alt="" />;
  return <span class="portrait" style={{ fontSize: `${Math.round(size * 0.8)}px` }} aria-hidden="true">{src}</span>;
}
