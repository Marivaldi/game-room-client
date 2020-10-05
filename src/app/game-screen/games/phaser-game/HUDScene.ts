export class HUDScene extends Phaser.Scene {
    private attackButton: Phaser.GameObjects.Image;
    private flagButton: Phaser.GameObjects.Image;
    private wavingFlag;

    constructor ()
    {
        super({ key: 'HUDScene', active: true });
    }

    public preload() {
        this.load.image('sword_button', 'assets/sword_button.png');
        this.load.image('flag_button', 'assets/flag_button.png');
        this.load.spritesheet('waving_flag', 'assets/animated_flag.png', { frameHeight: 300, frameWidth: 300 });
    }

    public create ()
    {
        this.flagButton = this.add.image(35, 35, 'flag_button').setScale(0.2).setDepth(10).setAlpha(0.5);
        this.anims.create({
            key: `flag_wave`,
            frames: this.anims.generateFrameNumbers('waving_flag', { start: 0, end: 9}),
            frameRate: 10,
            repeat: -1
        });

        this.attackButton = this.add.image(35, (this.flagButton.displayHeight*2), 'sword_button').setScale(0.2).setDepth(10).setAlpha(0.5);

        this.wavingFlag = this.add.sprite(this.cameras.main.width - 80, 80, 'waving_flag').setScale(0.4).setDepth(10).setAlpha(0.7).setVisible(false);
        this.wavingFlag.anims.play('flag_wave');

        const gameScene = this.scene.get('Game');
        gameScene.events.on('canAttack', (value: boolean) => {
            if(value) {
                this.attackButton.setAlpha(1);
                this.attackButton.setInteractive();
                this.attackButton.on('pointerup', this.attackClicked);
            } else {
                this.attackButton.setAlpha(0.5);
                this.attackButton.removeInteractive()
            }
        }, this);


        gameScene.events.on('canFlag', (value: boolean) => {
            if(value) {
                this.flagButton.setAlpha(1);
                this.flagButton.setInteractive();
                this.flagButton.on('pointerup', this.flagClicked);
            } else {
                this.flagButton.setAlpha(0.5);
                this.flagButton.removeInteractive()
            }
        }, this);

        gameScene.events.on('isAKillingRole', (value: boolean) => {
            this.attackButton.setVisible(value);
        }, this);


        gameScene.events.on('bodyFlagged', (value: boolean) => {
            this.wavingFlag.setVisible(value);
        });
    }


    attackClicked = () => {
        this.events.emit('attackClicked');
    }

    flagClicked = () => {
        this.events.emit('flagClicked');
    }

}