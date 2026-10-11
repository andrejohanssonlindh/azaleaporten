import { heroId, previousVisit, go } from './state';
import { enterHero } from './platform/profiles';

export function selectHero(id: string | null) {
  heroId.value = id;
  previousVisit.value = id ? enterHero(id) : null;
}

export function leaveToPicker() {
  selectHero(null);
  go('hjaltar');
}
