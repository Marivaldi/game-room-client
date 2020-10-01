import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';
import { InputManager } from './InputManager';
import { ObjectType } from './ObjectType';
import { PlayerManager } from './PlayerManager';
import { PlayerMovement } from './PlayerMovement';
import { SocketManager } from './SocketManager';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game',
};

export class GameScene extends Phaser.Scene {
    map: Phaser.Tilemaps.Tilemap;
    worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
    playerManager: PlayerManager;
    inputManager: InputManager;
    socketManager: SocketManager;
    overlapObjectsGroup: Phaser.Physics.Arcade.StaticGroup;
    velocity: number = 100;
    private otherPlayers: Phaser.Physics.Arcade.Group;
    private deadPlayers: Phaser.Physics.Arcade.Group;
    private tileset;
    private otherNames: Map<string, Phaser.GameObjects.Text> = new Map<string, Phaser.GameObjects.Text>();
    private otherHitBoxes: Map<string, Phaser.GameObjects.Sprite> = new Map<string, Phaser.Physics.Arcade.Sprite>();
    private attackCoolingDown: boolean = false;

    constructor(public gameSocket: GameSocketService) {
        super(sceneConfig);
    }

    public preload() {
        this.load.spritesheet('default_player', 'assets/default_player.png', { frameHeight: 72, frameWidth: 52 });
        this.load.spritesheet('hero_1', 'assets/hero_1.png', { frameHeight: 72, frameWidth: 52 });
        this.load.spritesheet('necromancer', 'assets/necromancer.png', { frameHeight: 72, frameWidth: 52 });
        this.load.spritesheet('hero_2', 'assets/hero_2.png', { frameHeight: 72, frameWidth: 52 });
        this.load.spritesheet('dead', 'assets/dead.png', { frameHeight: 72, frameWidth: 52 });
        this.load.image("tiles", "/assets/castle.png");
        this.load.tilemapTiledJSON("map", "/assets/main_map_v2.json");
        this.playerManager = new PlayerManager(this);
        this.inputManager = new InputManager(this);
        this.socketManager = new SocketManager(this);
    }

    public create() {

        this.setupWorldMap();

        this.setupOverlapObjects();


        this.setupAnimations('necromancer');
        this.setupAnimations('dead');
        this.setupAnimations('default_player');
        this.setupAnimations('hero_1');
        this.setupAnimations('hero_2');

        this.gameSocket.gameActionReceived$.subscribe(this.socketManager.handleMessage);

        this.gameSocket.pressPlay(GameKey.PHASER_GAME);

        this.socketManager.sendGetPlayersMessage();
        this.deadPlayers = this.physics.add.group();
    }

    public update() {
        const mySpriteHasNotLoadedYet = !this.playerManager.player || !this.playerManager.player.sprite;
        const inputIsDisabled = !this.game.input.keyboard.enabled;
        if (mySpriteHasNotLoadedYet || inputIsDisabled) return;

        this.playerManager.stopPlayer();

        const playerMoving: PlayerMovement = this.inputManager.handlePlayerMovement();

        this.handlePlayerInput();

        this.playerManager.handlePlayerMovement(playerMoving.left, playerMoving.right, playerMoving.down, playerMoving.up);

        if (!this.playerManager.mySpriteHasMoved()) {
            this.playerManager.stopPlayerAnimations();
            this.socketManager.sendPlayerStoppedMessage();
            return;
        }

        this.playerManager.moveMyNameToMatchMyNewPosition();
        this.socketManager.sendPlayerMovedMessage();
        this.playerManager.updatePreviousPosition();
        this.velocity = 100;
        this.playerManager.playersInRange = [];
    }

    handlePlayerInput() {
        const cursorKeys = this.input.keyboard.createCursorKeys();
        const thePlayerIsPressingSpacebar = cursorKeys.space.isDown;
        if (thePlayerIsPressingSpacebar && this.canAttack()) this.playerManager.attackPlayer(this.playerManager.playersInRange[0]);
    }

    canAttack() : boolean {
        const isAKillingRole: boolean = this.playerManager.player.isAKillingRole();
        const atLeastOnePlayerIsInRange: boolean = this.playerManager.playersInRange.length > 0;
        return isAKillingRole && atLeastOnePlayerIsInRange && !this.attackCoolingDown;
    }

    setupWorldMap() {
        this.map = this.make.tilemap({ key: "map" });
        this.physics.world.bounds.setTo(0, 0, 416, 416);
        this.tileset = this.map.addTilesetImage("castle", "tiles");
        this.map.createStaticLayer("Below Player", this.tileset, 0, 0);
        this.worldLayer = this.map.createStaticLayer("World", this.tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });
        const abovePlayer: Phaser.Tilemaps.StaticTilemapLayer = this.map.createStaticLayer("Above Player", this.tileset, 0, 0);
        abovePlayer.setDepth(5);
    }

    setupOverlapObjects() {
        const overlapObjects = this.map.getObjectLayer('Objects').objects;
        this.overlapObjectsGroup = this.physics.add.staticGroup({});
        overlapObjects.forEach(this.createOverlapObject);
        this.overlapObjectsGroup.refresh();
    }

    createOverlapObject = (object: Phaser.Types.Tilemaps.TiledObject) => {
        const obj = this.overlapObjectsGroup.create(object.x, object.y, null, null, false);
        obj.setScale(object.width / 32, object.height / 32);
        obj.setOrigin(0);
        obj.type = object.type;
        obj.name = object.name;
        obj.body.width = object.width;
        obj.body.height = object.height;
    }

    setupAnimations(spriteKey: string) {
        this.anims.create({
            key: `${spriteKey}_down`,
            frames: this.anims.generateFrameNumbers(spriteKey, { frames: [0, 1, 2] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: `${spriteKey}_up`,
            frames: this.anims.generateFrameNumbers(spriteKey, { frames: [9, 10, 11] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: `${spriteKey}_right`,
            frames: this.anims.generateFrameNumbers(spriteKey, { frames: [6, 7, 8] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: `${spriteKey}_left`,
            frames: this.anims.generateFrameNumbers(spriteKey, { frames: [3, 4, 5] }),
            frameRate: 10,
            repeat: -1
        });
    }


    handleOverlaps = (mySprite: Phaser.GameObjects.Sprite, overlappedObject: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body }) => {
        // We can check the type attribute on the overlapped object and write up logic to handle an type we want.
        switch (overlappedObject.type) {
            case ObjectType.SLOW_MOTION:
                this.makePlayerSlower();
                break;
            case ObjectType.OTHER_PLAYER:
                if(!this.playerManager.playersInRange.includes(overlappedObject.name)) {this.playerManager.playersInRange.push(overlappedObject.name);}
                break;
            default:
                break;
        }
    }

    makePlayerSlower() {
        this.velocity = 50;
    }
}
