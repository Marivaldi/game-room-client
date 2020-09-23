import { GameKey } from './enums/game-key';

export class Game {
    key: GameKey;
    title: string;
    subtitle: string;
    description: string;
    votes: number;
}
