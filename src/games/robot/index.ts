import { robotModule } from '../../engines/robot/RobotView';
import { buggjaktenGame, kodstigenGame, loopverkstadenGame } from './logic';

// Robotöns robotområden som frågefabriker.

export const kodstigen = robotModule(kodstigenGame);
export const loopverkstaden = robotModule(loopverkstadenGame);
export const buggjakten = robotModule(buggjaktenGame);
