import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';
import { ObjectType } from './ObjectType';
import { PlayerInformation } from './PlayerInformation';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game',
};

export class GameScene extends Phaser.Scene {
    private mySprite;
    private previousPosition: any = {};
    private otherPlayers: Phaser.Physics.Arcade.Group;
    private deadPlayers: Phaser.Physics.Arcade.Group;
    private worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private overlapObjectsGroup: Phaser.Physics.Arcade.StaticGroup;
    private map: Phaser.Tilemaps.Tilemap;
    private tileset;
    private sentStopped: boolean = false;
    private myName: Phaser.GameObjects.Text;
    private otherNames: Map<string, Phaser.GameObjects.Text> = new Map<string, Phaser.GameObjects.Text>();
    private otherHitBoxes: Map<string, Phaser.GameObjects.Sprite> = new Map<string, Phaser.Physics.Arcade.Sprite>();
    private playersInRange: string[] = [];
    private attackCoolingDown: boolean = false;
    private velocity: number = 100;
    private myPlayerType = "necromancer";

    constructor(private gameSocket: GameSocketService) {
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
    }

    public create() {

        this.setupWorldMap();

        this.setupOverlapObjects();


        this.setupAnimations('necromancer');
        this.setupAnimations('dead');
        this.setupAnimations('default_player');
        this.setupAnimations('hero_1');
        this.setupAnimations('hero_2');

        this.gameSocket.gameActionReceived$.subscribe(this.handleMessage);

        this.gameSocket.pressPlay(GameKey.PHASER_GAME);

        this.sendGetPlayersMessage();
        this.deadPlayers = this.physics.add.group();
    }

    public update() {
        const mySpriteHasNotLoadedYet = !this.mySprite;
        const inputIsDisabled = !this.game.input.keyboard.enabled;
        if (mySpriteHasNotLoadedYet || inputIsDisabled) return;

        this.mySprite.body.setVelocity(0);

        const playerMoving: PlayerMovement = this.getPlayerMovement();

        this.handlePlayerInput();

        this.handlePlayerMovement(playerMoving.left, playerMoving.right, playerMoving.down, playerMoving.up);

        if (!this.mySpriteHasMoved()) {
            this.mySprite.anims.stop();
            this.sendPlayerStoppedMessage();
            return;
        }

        this.moveMyNameToMatchMyNewPosition();
        this.sendPlayerMovedMessage();
        this.updatePreviousPosition();
        this.velocity = 100;
        this.playersInRange = [];
    }

    iAmAKillingRole(): boolean {
        return this.myPlayerType === "necromancer";
    }

    handlePlayerInput() {
        const cursorKeys = this.input.keyboard.createCursorKeys();
        const thePlayerIsPressingSpacebar = cursorKeys.space.isDown;
        if (thePlayerIsPressingSpacebar && this.canAttack()) this.attackPlayer(this.playersInRange[0]);
    }

    canAttack() : boolean {
        const isAKillingRole: boolean = this.iAmAKillingRole();
        const atLeastOnePlayerIsInRange: boolean = this.playersInRange.length > 0;
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

    handleMessage = (gameMessage) => {
        if (!gameMessage || !gameMessage.type) return;

        switch (gameMessage.type) {
            case "ADD_PLAYERS":
                this.handleAddPlayers(gameMessage.players);
                break;
            case "PLAYER_MOVED":
                this.handleOtherPlayerMoved(gameMessage);
                break;
            case "PLAYER_STOPPED":
                this.handleOtherPlayerStopped(gameMessage);
        }
    }

    sendGetPlayersMessage() {
        this.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.gameSocket.lobbyId,
            connectionId: this.gameSocket.server_connnection_id,
            gameMessage: {
                type: "GET_PLAYERS",
                connectionId: this.gameSocket.server_connnection_id
            }
        });
    }

    handleAddPlayers(playerPositions: PlayerInformation[]) {
        this.otherPlayers = this.physics.add.group();
        playerPositions.forEach((playerPosition: PlayerInformation) => {
            if (playerPosition.connectionId === this.gameSocket.server_connnection_id) {
                this.addPlayer(playerPosition);
            } else {
                this.addOtherPlayers(playerPosition, 'default_player');
            }
        });

        
        this.physics.add.overlap(this.mySprite, this.overlapObjectsGroup, this.handleOverlaps);
    }

    handleOverlaps = (mySprite: Phaser.GameObjects.Sprite, overlappedObject: Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body }) => {
        // We can check the type attribute on the overlapped object and write up logic to handle an type we want.
        switch (overlappedObject.type) {
            case ObjectType.SLOW_MOTION:
                this.makePlayerSlower();
                break;
            case ObjectType.OTHER_PLAYER:
                console.log(overlappedObject.name);
                this.playersInRange.push(overlappedObject.name);
                break;
            default:
                break;
        }
    }

    makePlayerSlower() {
        this.velocity = 50;
    }

    addPlayer(playerInfo: PlayerInformation) {
        const spawnPoint: any = this.map.findObject("SpawnPoints", (obj) => obj.name === playerInfo.spawnPoint);
        this.myPlayerType = playerInfo.role;
        this.mySprite = this.add.sprite(spawnPoint.x, spawnPoint.y, this.myPlayerType);
        this.cameras.main.startFollow(this.mySprite);
        this.mySprite.setScale(0.5)
        this.cameras.main.setZoom(2);
        this.physics.add.existing(this.mySprite);
        this.physics.add.collider(this.mySprite, this.worldLayer);
        this.mySprite.body.setCollideWorldBounds(true);
        this.mySprite.body.onWorldBounds = true;
        const style = { font: "11px Courier", fill: "#00ff44" };
        this.myName = this.add.text(this.mySprite.x - 5, this.mySprite.y - 11, playerInfo.username, style);
        this.mySprite.setDepth(2);
    }

    addOtherPlayers(playerInfo: PlayerInformation, spriteKey: string) {
        const spawnPoint: any = this.map.findObject("SpawnPoints", (obj) => obj.name === playerInfo.spawnPoint);
        const otherPlayer: Player = (this.add.sprite(spawnPoint.x, spawnPoint.y, spriteKey) as Player);
        otherPlayer.setScale(0.5);
        otherPlayer.connectionId = playerInfo.connectionId;
        otherPlayer.setDepth(2);
        this.otherPlayers.add(otherPlayer);
        this.addOtherPlayerName(otherPlayer, playerInfo);
        this.addOtherPlayerHitBox(otherPlayer, playerInfo);
    }

    addOtherPlayerName(otherPlayer, playerInfo) {
        const style = { font: "11px Courier", fill: "#00ff44" };
        const text = this.add.text(otherPlayer.body.position.x - 5, otherPlayer.body.position.y - 11, playerInfo.username, style);
        this.otherNames.set(playerInfo.connectionId, text);
    }

    addOtherPlayerHitBox(otherPlayer, playerInfo) {
        const obj = this.overlapObjectsGroup.create(otherPlayer.x, otherPlayer.y, null, null, false);
        obj.type = "OtherPlayer"
        obj.name = playerInfo.connectionId;
        obj.body.width = otherPlayer.body.width;
        obj.body.height = otherPlayer.body.height;
        this.otherHitBoxes.set(playerInfo.connectionId, obj);
    }

    attackPlayer(connectionId: string) {
        if (!this.otherPlayers) return;

        console.log(`Attacking Player ${connectionId}`);
        this.attackCoolingDown = true;
        setTimeout(() => {
            this.attackCoolingDown = false;
            console.log("Attack done cooling down");
        }, 5000)

        this.otherPlayers.getChildren().forEach((otherPlayer: Phaser.Physics.Arcade.Sprite & { connectionId: string }) => {
            if (connectionId === otherPlayer.connectionId) {
                otherPlayer.anims.stop();
                this.addDeadPlayer(otherPlayer.x,  otherPlayer.y, connectionId);
                this.otherPlayers.remove(otherPlayer);
                otherPlayer.destroy();
                this.otherNames.get(connectionId).setColor('#8B0000');
                // this.otherNames.get(connectionId).destroy();
                // this.otherNames.delete(connectionId);
                this.otherHitBoxes.get(connectionId).destroy();
                this.otherHitBoxes.delete(connectionId);
                this.playersInRange.filter((inRangeConnectionId) => connectionId !== inRangeConnectionId);
            }
        });
    }

    addDeadPlayer(x: number, y: number, connectionId: string) {
        const deadPlayer: Player = (this.add.sprite(x, y, 'dead') as Player);
        deadPlayer.setScale(0.5);
        deadPlayer.connectionId = connectionId;
        deadPlayer.setDepth(1);
        this.deadPlayers.add(deadPlayer);
    }

    handleOtherPlayerMoved(gameMessage) {
        if (!this.otherPlayers) return;

        this.otherPlayers.getChildren().forEach((otherPlayer: Phaser.Physics.Arcade.Sprite & { connectionId: string }) => {
            if (gameMessage.connectionId === otherPlayer.connectionId) {
                const thePlayerIsMovingLeft: boolean = gameMessage.x < otherPlayer.x;
                const thePlayerIsMovingRight: boolean = gameMessage.x > otherPlayer.x;
                const thePlayerIsMovingUp: boolean = gameMessage.y < otherPlayer.y;
                const thePlayerIsMovingDown: boolean = gameMessage.y > otherPlayer.y;

                if (thePlayerIsMovingDown) {
                    otherPlayer.anims.play('default_player_down', true);
                } else if (thePlayerIsMovingUp) {
                    otherPlayer.anims.play('default_player_up', true);
                }


                if (thePlayerIsMovingLeft) {
                    let animation = 'left';
                    if (thePlayerIsMovingUp) {
                        animation = 'up';
                    } else if (thePlayerIsMovingDown) {
                        animation = 'down';
                    }
                    otherPlayer.anims.play("default_player_" + animation, true);
                } else if (thePlayerIsMovingRight) {
                    let animation = 'right';
                    if (thePlayerIsMovingUp) {
                        animation = 'up';
                    } else if (thePlayerIsMovingDown) {
                        animation = 'down';
                    }
                    otherPlayer.anims.play("default_player_" + animation, true);
                }

                otherPlayer.setPosition(gameMessage.x, gameMessage.y);

                const otherPlayerName = this.otherNames.get(gameMessage.connectionId);
                otherPlayerName.x = otherPlayer.body.position.x - ((otherPlayerName.width / 2) - (otherPlayer.displayWidth / 2));
                otherPlayerName.y = otherPlayer.body.position.y - otherPlayerName.height;


                const otherPlayerHitBox = this.otherHitBoxes.get(gameMessage.connectionId);
                otherPlayerHitBox.x = otherPlayer.x
                otherPlayerHitBox.y = otherPlayer.y
                this.overlapObjectsGroup.refresh();
            }
        });
    }

    handleOtherPlayerStopped(gameMessage) {
        if (!this.otherPlayers) return;

        this.otherPlayers.getChildren().forEach(function (otherPlayer: Phaser.Physics.Arcade.Sprite & { connectionId: string }) {
            if (gameMessage.connectionId === otherPlayer.connectionId) {
                otherPlayer.anims.stop();
            }
        });
    }

    getPlayerMovement(): PlayerMovement {
        const playerMoving: PlayerMovement = new PlayerMovement();
        const pointer = this.input.activePointer;
        const cursorKeys = this.input.keyboard.createCursorKeys();
        const aKey = this.input.keyboard.addKey('A');
        const dKey = this.input.keyboard.addKey('D');
        const wKey = this.input.keyboard.addKey('W');
        const sKey = this.input.keyboard.addKey('S');
        if (pointer.isDown) {
            playerMoving.left = pointer.worldX < Math.round(this.mySprite.x);
            playerMoving.right = pointer.worldX > Math.round(this.mySprite.x);
            playerMoving.up = pointer.worldY < Math.round(this.mySprite.y);
            playerMoving.down = pointer.worldY > Math.round(this.mySprite.y);
        } else {
            playerMoving.left = cursorKeys.left.isDown || aKey.isDown;
            playerMoving.right = cursorKeys.right.isDown || dKey.isDown;
            playerMoving.up = cursorKeys.up.isDown || wKey.isDown;
            playerMoving.down = cursorKeys.down.isDown || sKey.isDown;
        }

        return playerMoving;
    }

    mySpriteHasMoved() {
        return this.previousPosition && (this.mySprite.x !== this.previousPosition.x || this.mySprite.y !== this.previousPosition.y);
    }

    sendPlayerMovedMessage() {
        this.sentStopped = false;
        this.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.gameSocket.lobbyId,
            connectionId: this.gameSocket.server_connnection_id,
            gameMessage: {
                type: "PLAYER_MOVED",
                connectionId: this.gameSocket.server_connnection_id,
                x: this.mySprite.x,
                y: this.mySprite.y
            }
        });
    }

    handlePlayerMovement(thePlayerIsMovingLeft: boolean, thePlayerIsMovingRight: boolean, thePlayerIsMovingDown: boolean, thePlayerIsMovingUp: boolean) {
        if (thePlayerIsMovingLeft) {
            this.mySprite.body.setVelocityX(this.velocity * -1);
            let animation = 'left';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }
            this.mySprite.anims.play(this.myPlayerType + "_" + animation, true);
        } else if (thePlayerIsMovingRight) {
            this.mySprite.body.setVelocityX(this.velocity);
            let animation = 'right';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }
            this.mySprite.anims.play(this.myPlayerType + "_" + animation, true);
        }

        if (thePlayerIsMovingUp) {
            this.mySprite.body.setVelocityY(this.velocity * -1);
            this.mySprite.anims.play(this.myPlayerType+'_up', true);
        } else if (thePlayerIsMovingDown) {
            this.mySprite.body.setVelocityY(this.velocity);
            this.mySprite.anims.play(this.myPlayerType+'_down', true);
        }
    }

    sendPlayerStoppedMessage() {
        if (this.sentStopped) return;

        this.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.gameSocket.lobbyId,
            connectionId: this.gameSocket.server_connnection_id,
            gameMessage: {
                type: "PLAYER_STOPPED",
                connectionId: this.gameSocket.server_connnection_id
            }
        });

        this.sentStopped = true;
    }


    moveMyNameToMatchMyNewPosition() {
        this.myName.x = this.mySprite.body.position.x - ((this.myName.width / 2) - (this.mySprite.displayWidth / 2));
        this.myName.y = this.mySprite.body.position.y - this.myName.height;
    }

    updatePreviousPosition() {
        this.previousPosition = {
            x: this.mySprite.x,
            y: this.mySprite.y
        };
    }
}

class Player extends Phaser.GameObjects.Sprite {
    connectionId: string;
}

class PlayerMovement {
    left: boolean = false;
    right: boolean = false;
    up: boolean = false;
    down: boolean = false;
}

