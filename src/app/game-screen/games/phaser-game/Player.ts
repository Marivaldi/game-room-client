import { PlayerRoles } from './PlayerRoles';

export class Player {
    username: string;
    alive: boolean = true;
    sprite: (Phaser.Physics.Arcade.Sprite & {body: Phaser.Physics.Arcade.Body} | Phaser.GameObjects.Sprite & {body: Phaser.Physics.Arcade.Body});
    overlapArea: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body };
    name: Phaser.GameObjects.Text;

    constructor(public connectionId: string,  public role: PlayerRoles) {}

    isAKillingRole(): boolean {
        return this.role === PlayerRoles.NECROMANCER;
    }
}