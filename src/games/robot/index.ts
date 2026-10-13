import { robotModule } from '../../engines/robot/RobotView';
import { buggjaktenGame, kodstigenGame, loopverkstadenGame } from './logic';
import { BUGGJAKTEN, KODSTIGEN, LOOPVERKSTADEN } from './lektioner';

// Robotöns robotområden som frågefabriker.

export const kodstigen = { ...robotModule(kodstigenGame), lessons: KODSTIGEN };
export const loopverkstaden = { ...robotModule(loopverkstadenGame), lessons: LOOPVERKSTADEN };
export const buggjakten = { ...robotModule(buggjaktenGame), lessons: BUGGJAKTEN };
