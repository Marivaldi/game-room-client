import { GameScene } from './GameScene';
import { PlayerMovement } from './PlayerMovement';

export class InputManager{
    constructor(public scene: GameScene) {}
    
    handlePlayerMovement(): PlayerMovement {
        const playerMoving: PlayerMovement = new PlayerMovement();
        const pointer = this.scene.input.activePointer;
        const cursorKeys = this.scene.input.keyboard.createCursorKeys();
        const aKey = this.scene.input.keyboard.addKey('A');
        const dKey = this.scene.input.keyboard.addKey('D');
        const wKey = this.scene.input.keyboard.addKey('W');
        const sKey = this.scene.input.keyboard.addKey('S');
        const sprite = this.scene.playerManager.player.sprite;
        if (pointer.isDown) {
            playerMoving.left = pointer.worldX < Math.round(sprite.x);
            playerMoving.right = pointer.worldX > Math.round(sprite.x);
            playerMoving.up = pointer.worldY < Math.round(sprite.y);
            playerMoving.down = pointer.worldY > Math.round(sprite.y);
        } else {
            playerMoving.left = cursorKeys.left.isDown || aKey.isDown;
            playerMoving.right = cursorKeys.right.isDown || dKey.isDown;
            playerMoving.up = cursorKeys.up.isDown || wKey.isDown;
            playerMoving.down = cursorKeys.down.isDown || sKey.isDown;
        }

        return playerMoving;
    }
}