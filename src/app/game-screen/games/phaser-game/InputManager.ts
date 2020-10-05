import { GameScene } from './GameScene';
import { HUDScene } from './HUDScene';
import { PlayerMovement } from './PlayerMovement';

export class InputManager {
    constructor(public scene: GameScene) { }

    handlePlayerMovement(): PlayerMovement {
        const hudScene: HUDScene = this.scene.scene.get('HUDScene') as HUDScene;
        const playerMoving: PlayerMovement = new PlayerMovement();
        const cursorKeys = this.scene.input.keyboard.createCursorKeys();
        const aKey = this.scene.input.keyboard.addKey('A');
        const dKey = this.scene.input.keyboard.addKey('D');
        const wKey = this.scene.input.keyboard.addKey('W');
        const sKey = this.scene.input.keyboard.addKey('S');

        playerMoving.left = cursorKeys.left.isDown || aKey.isDown || hudScene.joystick.left;
        playerMoving.right = cursorKeys.right.isDown || dKey.isDown || hudScene.joystick.right;
        playerMoving.up = cursorKeys.up.isDown || wKey.isDown || hudScene.joystick.up;
        playerMoving.down = cursorKeys.down.isDown || sKey.isDown || hudScene.joystick.down;




        return playerMoving;
    }
}