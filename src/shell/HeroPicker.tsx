import { dataRev, gate, go } from '../state';
import { getHeroState, listHeroes } from '../platform/profiles';
import { gradeName, heroClass } from '../content/heroes';
import { selectHero } from '../session';
import { Avatar, Screen, UpdateBanner } from './ui';

export function HeroPicker() {
  dataRev.value;
  const heroes = listHeroes();
  const g = gate.value!;

  return (
    <Screen class="picker">
      <UpdateBanner />
      {g.needsPassword && (
        <button class="banner magic" onClick={() => go('porten')}>
          🌸 Porten har vaknat! Viska lösenordet för att släppa in Mästarna.
        </button>
      )}
      <h1 class="page-title">Vem kliver in genom porten?</h1>
      <div class="hero-grid">
        {heroes.map((p) => (
          <button key={p.id} class="hero-card" onClick={() => { selectHero(p.id); go('karta'); }}>
            <Avatar p={p} size={84} />
            <b class="hero-card-name">{p.name}</b>
            <small>{heroClass(p.heroClass).emoji} {heroClass(p.heroClass).name} · Nivå {getHeroState(p.id).level}</small>
            <small class="muted">{gradeName(p.grade)}</small>
          </button>
        ))}
        <button class="hero-card new" onClick={() => go('ny')}>
          <span class="plus" aria-hidden="true">＋</span>
          <b>Ny hjälte</b>
        </button>
      </div>
      <footer class="picker-foot">
        <button class="link" onClick={() => go('vuxen')}>Vuxenläge</button>
      </footer>
    </Screen>
  );
}
