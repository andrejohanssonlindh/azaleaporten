import { BEATS, GROUPS, weaponGroup } from '../platform/rpg/vapen';
import type { Cosmetic } from '../platform/rpg/wardrobe';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { chestModal, dataRev, go, heroId, route, toast, touch } from '../state';
import { getHeroState, getProfile } from '../platform/profiles';
import { buy, canUpgrade, getInv, isEquipped, openChestFull, salvage, SHOP, upgrade } from '../platform/rpg/inventory';
import { itemStats, MAX_PLUS, RARITIES, salvageValue, statLine, upgradeCost, type Item } from '../platform/rpg/items';
import { today } from '../platform/rpg/progress';
import { leaveToPicker } from '../session';
import { BackBar, Screen } from './ui';

// Föremålskort, kistöppning och Smedjan.

export function ItemCard({ it, children, equipped = false, note }: { it: Item; children?: ComponentChildren; equipped?: boolean; note?: ComponentChildren }) {
  const r = RARITIES[it.rarity];
  return (
    <div class={`item-card${equipped ? ' equipped' : ''}`} style={{ borderColor: r.color }}>
      <span class="item-icon" style={{ background: `${r.color}22` }}>{it.icon}</span>
      <div class="item-text">
        <b style={{ color: r.color }}>{it.name}{it.plus ? ` +${it.plus}` : ''}</b>
        <small>{r.name}{it.unique ? ' · Unik' : ''} · Nivå {it.ilvl}{equipped ? ' · Används' : ''}</small>
        <span class="item-stats">{statLine(itemStats(it))}</span>
        {weaponGroup(it) && <span class="item-group">{GROUPS[weaponGroup(it)!].icon} {GROUPS[weaponGroup(it)!].name} · starkt mot {GROUPS[BEATS[weaponGroup(it)!]].name.toLowerCase()}</span>}
        {it.flavor && <i class="item-flavor">{it.flavor}</i>}
        {note}
      </div>
      {children && <div class="item-actions">{children}</div>}
    </div>
  );
}

const reduceMotion = () => matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Kistöppning som överlägg. Föremålet är redan bestämt (seed) – animationen är bara för spänningen. */
export function ChestModal() {
  const id = chestModal.value;
  const [phase, setPhase] = useState<'closed' | 'shaking' | 'open' | 'full'>('closed');
  const [items, setItems] = useState<Item[]>([]);
  const [look, setLook] = useState<Cosmetic | null>(null);
  const hid = heroId.value;
  if (!id || !hid) return null;
  const chest = getInv(hid).chests.find((c) => c.id === id);
  const close = () => { chestModal.value = null; setPhase('closed'); setItems([]); setLook(null); touch(); };

  function open() {
    const got = openChestFull(hid!, id!);
    if (!got) { setPhase('full'); return; }
    setItems(got.items);
    setLook(got.look ?? null);
    setPhase('shaking');
    setTimeout(() => setPhase('open'), reduceMotion() ? 0 : 900);
  }

  return (
    <div class="modal" onClick={(e) => { if (e.target === e.currentTarget && phase !== 'shaking') close(); }}>
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="Skattkista">
        {phase !== 'open' && (
          <>
            <div class={`chest-big${phase === 'shaking' ? ' shaking' : ''}`}>{chest?.kind === 'pionjar' || chest?.kind === 'spel' ? '🎁' : chest?.kind === 'boss' ? '💎' : chest?.kind === 'dag' ? '📜' : '🧰'}</div>
            <h2>{chest?.kind === 'pionjar' ? 'Pionjärkistan' : chest?.kind === 'boss' ? 'Bosskista' : chest?.kind === 'dag' ? 'Dagens kista' : chest?.kind === 'spel' ? 'Spelöns skattkista' : 'Skattkista'}</h2>
            {chest && <p class="muted">Hittad vid {chest.source}</p>}
            {phase === 'full' && <p class="note warn">Packningen är full! Smält något i Smedjan först.</p>}
            <div class="row center-row">
              <button class="btn" onClick={close}>Senare</button>
              {phase === 'closed' && chest && <button class="btn primary big" onClick={open}>Öppna!</button>}
            </div>
          </>
        )}
        {phase === 'open' && (
          <>
            <div class="chest-big">✨</div>
            <h2>Du fick:</h2>
            {items.map((it) => <ItemCard key={it.id} it={it} />)}
            {look && (
              <div class="item-card look-card">
                <span class="item-icon">{look.icon}</span>
                <div class="item-text"><b>{look.name}</b><small>Ett plagg som bara finns i skattkistor!</small></div>
              </div>
            )}
            <p class="note">{look ? 'Ta på dig det i Garderoben i Azaleagården.' : `Ta på dig ${items.length > 1 ? 'dem' : 'den'} i Azaleagården, så syns ${items.length > 1 ? 'de' : 'den'} på din hjälte.`}</p>
            <div class="row center-row">
              <button class="btn" onClick={close}>Toppen!</button>
              {route.value[0] !== 'gard' && <button class="btn primary" onClick={() => { close(); go(look ? 'gard/garderob' : 'gard'); }}>Till Azaleagården</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Smedjan() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  const [tab, setTab] = useState<'butik' | 'smalt' | 'forbattra'>('butik');
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const s = getHeroState(p.id);
  const inv = getInv(p.id);
  const meltable = inv.items.filter((it) => !it.unique && !isEquipped(inv, it.id));

  return (
    <Screen class="place">
      <BackBar label="Azaleabyn" to="by" right={<span class="purse">🌰 {s.kastanjer} · 🌸 {s.blad}</span>} />
      <div class="place-banner forge"><span>⚒️</span><h1>Smedjan</h1></div>
      <div class="tabs" role="tablist">
        {([['butik', 'Butik'], ['smalt', 'Smält'], ['forbattra', 'Förbättra']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} class={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'butik' && (
        <section class="card">
          {SHOP.map((x) => (
            <div class="shop-row" key={x.id}>
              <span class="item-icon">{x.icon}</span>
              <div class="item-text"><b>{x.name}</b><small>{x.desc}</small></div>
              <button class="btn small primary" disabled={s.kastanjer < x.cost}
                onClick={() => { if (buy(p.id, x.id, today())) { toast(`${x.icon} ${x.name} köpt!`); touch(); } else toast('Det gick inte just nu.'); }}>{x.cost} 🌰</button>
            </div>
          ))}
          <p class="note">Du har {inv.potions.liv} livsdryck{inv.potions.liv === 1 ? '' : 'er'} · {inv.potions.skold ?? 0} sköldamulett{(inv.potions.skold ?? 0) === 1 ? '' : 'er'} · Packning {inv.items.length}/{inv.capacity}</p>
        </section>
      )}

      {tab === 'smalt' && (
        <section class="card">
          <p class="muted">Smält föremål du inte behöver till azaleablad 🌸. Föremål du använder och unika föremål kan inte smältas.</p>
          {meltable.length === 0 && <p class="note">Inget att smälta just nu.</p>}
          {meltable.map((it) => (
            <ItemCard key={it.id} it={it}>
              <button class="btn small" onClick={() => { const b = salvage(p.id, it.id); toast(`🔥 +${b} 🌸`); touch(); }}>Smält +{salvageValue(it)} 🌸</button>
            </ItemCard>
          ))}
        </section>
      )}

      {tab === 'forbattra' && (
        <section class="card">
          <p class="muted">Varje förbättring ger +1 på föremålets starkaste egenskap (högst +{MAX_PLUS}).</p>
          {inv.items.length === 0 && <p class="note">Hitta föremål i skattkistor först.</p>}
          {inv.items.map((it) => {
            const c = upgradeCost(it);
            return (
              <ItemCard key={it.id} it={it} equipped={isEquipped(inv, it.id)}>
                {it.plus >= MAX_PLUS ? <small class="muted">Max!</small> : (
                  <button class="btn small primary" disabled={!canUpgrade(p.id, it)} onClick={() => { if (upgrade(p.id, it.id)) { toast(`⚒️ ${it.name} +${it.plus + 1}!`); touch(); } }}>
                    +1 för {c.blad} 🌸 {c.kastanjer} 🌰
                  </button>
                )}
              </ItemCard>
            );
          })}
        </section>
      )}
    </Screen>
  );
}
