import { kartaModule } from '../../engines/karta/KartaFraga';
import * as kartrum from './kartrummet';
import * as glob from './globen';
import * as sverige from './sverige';
import * as ballong from './ballong';
import * as huvudstad from './huvudstad';
import * as flagg from './flagg';
import { geoGame } from './gen';
import { FLAGGOR } from './flaggor';
import { GLOBEN, HUVUDSTADSEXPRESSEN, KARTRUMMET, SVERIGERESAN } from './lektioner';

// Kompassöns områden som frågefabriker.

export const kartrumGame = geoGame('kartrummet', kartrum.makeQ, kartrum.specsForSkill);
export const globGame = geoGame('globen', glob.makeQ, glob.specsForSkill);
export const sverigeGame = geoGame('sverigeresan', sverige.makeQ, sverige.specsForSkill);
export const ballongGame = geoGame('ballongresan', ballong.makeQ, ballong.specsForSkill);
export const huvudstadGame = geoGame('huvudstadsexpressen', huvudstad.makeQ, huvudstad.specsForSkill);
export const flaggGame = geoGame('flaggmasten', flagg.makeQ, flagg.specsForSkill);

export const kartrummet = { ...kartaModule(kartrumGame), lessons: KARTRUMMET };
export const globen = { ...kartaModule(globGame), lessons: GLOBEN };
export const sverigeresan = { ...kartaModule(sverigeGame), lessons: SVERIGERESAN };
export const ballongresan = kartaModule(ballongGame);
export const huvudstadsexpressen = { ...kartaModule(huvudstadGame), lessons: HUVUDSTADSEXPRESSEN };
export const flaggmasten = kartaModule(flaggGame, FLAGGOR);
