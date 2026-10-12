import { LOOK_SLOTS, type Cosmetic, type LookSlot } from '../platform/rpg/wardrobe';

// Filter för Garderoben och Skräddaren: vilken del, och vanliga (köps för kastanjer) eller speciella (låses upp, kistor, uppdrag).

export type LookKind = 'alla' | 'vanliga' | 'speciella';
export interface LookFilterState { slot: LookSlot | 'alla'; kind: LookKind }
export const ALL_LOOKS: LookFilterState = { slot: 'alla', kind: 'alla' };

export const isSpecial = (c: Cosmetic) => c.cost === undefined;
export const lookMatch = (f: LookFilterState, c: Cosmetic) =>
  (f.slot === 'alla' || f.slot === c.slot) && (f.kind === 'alla' || (f.kind === 'speciella') === isSpecial(c));

export function LookFilter({ f, set }: { f: LookFilterState; set: (f: LookFilterState) => void }) {
  const kinds: [LookKind, string][] = [['alla', 'Alla sorter'], ['vanliga', '🌰 Vanliga'], ['speciella', '⭐ Speciella']];
  return (
    <div class="look-filter">
      <div class="seg" role="group" aria-label="Vilken del">
        <button class={f.slot === 'alla' ? 'on' : ''} aria-pressed={f.slot === 'alla'} onClick={() => set({ ...f, slot: 'alla' })}>Allt</button>
        {LOOK_SLOTS.map((ls) => (
          <button key={ls.id} class={f.slot === ls.id ? 'on' : ''} aria-pressed={f.slot === ls.id} onClick={() => set({ ...f, slot: ls.id })}>{ls.icon} {ls.name}</button>
        ))}
      </div>
      <div class="seg" role="group" aria-label="Vilken sort">
        {kinds.map(([k, label]) => (
          <button key={k} class={f.kind === k ? 'on' : ''} aria-pressed={f.kind === k} onClick={() => set({ ...f, kind: k })}>{label}</button>
        ))}
      </div>
    </div>
  );
}
