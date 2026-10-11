import type { ComponentChildren } from 'preact';
import { animal, color, heroClass } from '../content/heroes';
import type { Profile } from '../platform/profiles';
import { getHeroState } from '../platform/profiles';
import { applyUpdate, canSpeak, speak, updateReady } from '../platform/device';
import { hasNewerData } from '../platform/storage/record';
import { go } from '../state';

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
          <small>{heroClass(p.heroClass).name} · Nivå {s.level}</small>
        </span>
      </button>
      <span class="purse" title="Kastanjer">🌰 {s.kastanjer}</span>
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

export function Mentor({ text, children }: { text: string; children?: ComponentChildren }) {
  return (
    <section class="mentor">
      <div class="mentor-face" aria-hidden="true">🌰</div>
      <div class="mentor-bubble">
        <div class="mentor-name">Mästare Kastanj</div>
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
