import { diagramModule } from '../../engines/diagram/DiagramView';
import * as fagel from './fagel';
import * as skord from './skord';
import { diagramGame } from './gen';
import { FAGELTORNET, SKORDEMARKNADEN } from './lektioner';

// Diagramdalens områden som frågefabriker.

export const fagelGame = diagramGame('fageltornet', fagel.makeQ, fagel.specsForSkill);
export const skordGame = diagramGame('skordemarknaden', skord.makeQ, skord.specsForSkill);

export const fageltornet = { ...diagramModule(fagelGame), lessons: FAGELTORNET };
export const skordemarknaden = { ...diagramModule(skordGame), lessons: SKORDEMARKNADEN };
