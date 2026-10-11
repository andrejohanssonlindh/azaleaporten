import type { ComponentChildren } from 'preact';
import { animal, color, heroClass } from '../content/heroes';
import type { Profile } from '../platform/profiles';
import { getHeroState } from '../platform/profiles';
import { applyUpdate, canSpeak, speak, updateReady } from '../platform/device';
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
