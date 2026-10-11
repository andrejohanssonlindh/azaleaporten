import { dataRev, go, heroId } from '../state';
import { getProfile } from '../platform/profiles';
import { findNode, getPlay } from '../platform/rpg/progress';
import { PRACTICE_LENGTH } from '../platform/rpg/balance';
import { dueSkills, mistByArea } from '../platform/learning/skills';
import { playable } from '../content/areas';
import { skillLabel } from '../content/skills';
import { leaveToPicker } from '../session';
import { BackBar, Mentor, Screen } from './ui';

// Övningsängen, utanför byn. Här jagar man bort Glömskans dimma: fem frågor på det som är dags
// att repetera. Utan dimma kan man repetera det man gjorde senast.

export function Ovning() {
  dataRev.value;
  const p = getProfile(heroId.value!);
  if (!p) { queueMicrotask(leaveToPicker); return null; }
  const last = getPlay(p.id).last;
  const pl = last && playable(last.areaId);
  const node = pl && findNode(pl.def, last!.nodeId);
  const mist = Object.entries(mistByArea(p.id)).filter(([a]) => playable(a)).sort((a, b) => b[1] - a[1]);
  const names = (a: string) => dueSkills(p.id, a).slice(0, 2).map((d) => skillLabel(d.skill)).join(' och ');

  return (
    <Screen class="place">
      <BackBar label="Till ön" to="karta" />
      <div class="place-banner meadow"><span>🎯</span><h1>Övningsängen</h1></div>
      {mist.length > 0 ? (
        <>
          <Mentor text={`Glömskans dimma har lagt sig över ${mist.map(([a]) => playable(a)!.def.title).join(' och ')}. Det betyder att det är dags att repetera – då fastnar kunskapen på riktigt. Fem frågor jagar bort dimman!`} />
          <div class="mist-list">
            {mist.map(([a, n]) => (
              <button key={a} class="mist-item" onClick={() => go(`repetera/${a}`)}>
                <span class="mist-icon" aria-hidden="true">🌫️</span>
                <span><b>{playable(a)!.def.title}</b><small>{n === 1 ? '1 sak' : `${n} saker`} att repetera: {names(a)}</small></span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <Mentor text={node
          ? `Ingen dimma i sikte – allt sitter fint! Vill du ändå öva? Senast spelade du "${node.name}" i ${pl!.def.title}. Inga stjärnor här – bara träning.`
          : 'Här på ängen repeterar vi det du har lärt dig. Spela något först – till exempel i Talbergen – så kan vi öva på det här sedan.'} />
      )}
      {node ? (
        <button class={`btn big continue${mist.length ? '' : ' primary'}`} onClick={() => go(`ovning/${last!.areaId}/${node.id}`)}>🎯 Repetera {node.name} ({PRACTICE_LENGTH} frågor)</button>
      ) : (
        <button class="btn primary big continue" onClick={() => go('region/talbergen')}>⛰️ Till Talbergen</button>
      )}
    </Screen>
  );
}
