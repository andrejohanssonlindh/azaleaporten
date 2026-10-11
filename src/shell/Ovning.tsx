import { dataRev, go, heroId } from '../state';
import { getProfile } from '../platform/profiles';
import { findNode, getPlay } from '../platform/rpg/progress';
import { PRACTICE_LENGTH } from '../platform/rpg/balance';
import { playable } from '../content/areas';
import { leaveToPicker } from '../session';
import { BackBar, Mentor, Screen } from './ui';

// Övningsängen, utanför byn: snabb repetition av det hjälten gjorde senast.
// I fas 4 väljer schemaläggaren (Glömskans dimma) vad som ska repeteras.

export function Ovning() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const last = getPlay(p.id).last;
  const pl = last && playable(last.areaId);
  const node = pl && findNode(pl.def, last!.nodeId);

  return (
    <Screen class="place">
      <BackBar label="Till ön" to="karta" />
      <div class="place-banner meadow"><span>🎯</span><h1>Övningsängen</h1></div>
      {node ? (
        <>
          <Mentor text={`Senast övade du "${node.name}" i ${pl!.def.title}. Fem snabba frågor håller kunskapen vass! Inga stjärnor här – bara träning.`} />
          <button class="btn primary big continue" onClick={() => go(`ovning/${last!.areaId}/${node.id}`)}>🎯 Repetera {node.name} ({PRACTICE_LENGTH} frågor)</button>
        </>
      ) : (
        <>
          <Mentor text="Här på ängen repeterar vi det du har gjort. Spela något först – till exempel i Tidstornet – så kan vi öva på det här sedan." />
          <button class="btn primary big continue" onClick={() => go('omrade/tidstornet')}>🕰️ Till Tidstornet</button>
        </>
      )}
    </Screen>
  );
}
