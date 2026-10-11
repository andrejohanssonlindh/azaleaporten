import { go, previousVisit } from '../state';
import type { Profile } from '../platform/profiles';
import { greeting } from '../platform/greeting';
import { findNode, getPlay } from '../platform/rpg/progress';
import { dueSkills } from '../platform/learning/skills';
import { playable } from '../content/areas';
import { skillLabel } from '../content/skills';
import { Mentor } from './ui';

// Mästare Kastanjs hälsning med knappar: jaga bort dimman direkt, eller titta på dagens uppdrag.

export function KastanjGreeting({ p, compact = false }: { p: Profile; compact?: boolean }) {
  const last = getPlay(p.id).last;
  const la = last && playable(last.areaId);
  const ln = la && findNode(la.def, last!.nodeId);
  const due = dueSkills(p.id).filter((d) => playable(d.item.area));
  const top = due[0];
  const inTop = top ? due.filter((d) => d.item.area === top.item.area).length : 0;
  const text = greeting(p.name, previousVisit.value, ln ? `${ln.name} i ${la!.def.title}` : null, new Date(), {
    lastResult: ln ? last!.result : undefined,
    mist: top ? { skill: skillLabel(top.skill), area: playable(top.item.area)!.def.title, count: inTop } : undefined,
  });
  return (
    <Mentor text={text} compact={compact}>
      {previousVisit.value && (
        <div class="row mentor-actions">
          {top && <button class="btn small primary" onClick={() => go(`repetera/${top.item.area}`)}>Ja, kör!</button>}
          <button class="btn small" onClick={() => go('uppdrag')}>📜 Visa uppdragen</button>
        </div>
      )}
    </Mentor>
  );
}
