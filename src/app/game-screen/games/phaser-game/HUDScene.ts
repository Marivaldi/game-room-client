export class HUDScene extends Phaser.Scene {
    private attackButton: Phaser.GameObjects.Image;

    constructor ()
    {
        super({ key: 'HUDScene', active: true });
    }

    public preload() {
        this.load.image('sword_button', 'assets/sword_button.png');
        this.load.image('flag_button', 'assets/flag_button.png');
    }

    public create ()
    {
        this.attackButton = this.add.image(35, 35, 'sword_button').setScale(0.2).setDepth(10).setAlpha(0.5).setInteractive();
        this.input.on('gameobjectup', this.attackClicked, this);
        let gameScene = this.scene.get('Game');

        this.add.image(35, (this.attackButton.displayHeight*2) + 5, 'flag_button').setScale(0.2).setDepth(10).setAlpha(0.5).setInteractive();

        //  Listen for events from it
        gameScene.events.on('canAttack', (value: boolean) => {
            if(value) {
                this.attackButton.setAlpha(1);
            } else {
                this.attackButton.setAlpha(0.5);
            }
        }, this);
    }

    attackClicked = () => {

    }
}