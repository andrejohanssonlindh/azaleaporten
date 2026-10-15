import { diagramModule } from '../../engines/diagram/DiagramView';
import * as fagel from './fagel';
import * as skord from './skord';
import * as vader from './vader';
import * as rost from './rost';
import * as lage from './lage';
import * as spegel from './spegel';
import * as press from './press';
import { diagramGame } from './gen';
import { FAGELTORNET, SKORDEMARKNADEN } from './lektioner';
import { OMROSTNINGSTORGET, SKVALLERPRESSEN, SPEGELSALEN, VAGMASTARENS_BOD, VADERSTATIONEN } from './lektioner2';

// Diagramdalens områden som frågefabriker.

export const fagelGame = diagramGame('fageltornet', fagel.makeQ, fagel.specsForSkill);
export const skordGame = diagramGame('skordemarknaden', skord.makeQ, skord.specsForSkill);
export const vaderGame = diagramGame('vaderstationen', vader.makeQ, vader.specsForSkill, vader.vaderExtra);
export const rostGame = diagramGame('omrostningstorget', rost.makeQ, rost.specsForSkill, rost.rostExtra);
export const lageGame = diagramGame('vagmastarens-bod', lage.makeQ, lage.specsForSkill, lage.lageExtra);
export const spegelGame = diagramGame('spegelsalen', spegel.makeQ, spegel.specsForSkill, spegel.spegelExtra);
export const pressGame = diagramGame('skvallerpressen', press.makeQ, press.specsForSkill, press.pressExtra);

export const fageltornet = { ...diagramModule(fagelGame), lessons: FAGELTORNET };
export const skordemarknaden = { ...diagramModule(skordGame), lessons: SKORDEMARKNADEN };
export const vaderstationen = { ...diagramModule(vaderGame), lessons: VADERSTATIONEN };
export const omrostningstorget = { ...diagramModule(rostGame), lessons: OMROSTNINGSTORGET };
export const vagmastarensBod = { ...diagramModule(lageGame), lessons: VAGMASTARENS_BOD };
export const spegelsalen = { ...diagramModule(spegelGame), lessons: SPEGELSALEN };
export const skvallerpressen = { ...diagramModule(pressGame), lessons: SKVALLERPRESSEN };
