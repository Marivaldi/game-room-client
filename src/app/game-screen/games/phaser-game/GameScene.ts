import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';
import { PlayerPosition } from './PlayerPosition';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game',
};

export class GameScene extends Phaser.Scene {
    private mySprite;
    private previousPosition: any = {};
    private otherPlayers;
    private worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private overlapObjectsGroup: Phaser.Physics.Arcade.StaticGroup;
    private map: Phaser.Tilemaps.Tilemap;
    private tileset;
    private sentStopped: boolean = false;
    private myName: Phaser.GameObjects.Text;
    private otherNames: Map<string, Phaser.GameObjects.Text> = new Map<string, Phaser.GameObjects.Text>();
    private velocity: number = 100;
    constructor(private gameSocket: GameSocketService) {
        super(sceneConfig);
    }

    public preload() {
        this.load.spritesheet('main_guy', 'assets/Character.png', { frameHeight: 32, frameWidth: 32, endFrame: 15 });
        this.load.image("tiles", "/assets/castle.png");
        this.load.tilemapTiledJSON("map", "/assets/main_map_v2.json");
    }

    public create() {

        this.setupWorldMap();

        this.setupOverlapObjects();

        this.setupMainGuyAnimations();

        this.gameSocket.gameActionReceived$.subscribe(this.handleMessage);

        this.gameSocket.pressPlay(GameKey.PHASER_GAME);

        this.sendGetPlayersMessage();
    }

    public update() {
        const mySpriteHasNotLoadedYet = !this.mySprite;
        const inputIsDisabled = !this.game.input.keyboard.enabled;
        if (mySpriteHasNotLoadedYet || inputIsDisabled) return;

        this.mySprite.body.setVelocity(0);

        const playerMoving: PlayerMovement = this.getPlayerMovement();

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
    }

    setupWorldMap() {
        this.map = this.make.tilemap({ key: "map" });
        this.physics.world.bounds.setTo(0, 0, 416, 416);
        this.tileset = this.map.addTilesetImage("castle", "tiles");
        this.map.createStaticLayer("Below Player", this.tileset, 0, 0);
        this.worldLayer = this.map.createStaticLayer("World", this.tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });
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

    setupMainGuyAnimations() {
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('main_guy', { frames: [0, 4, 8, 12] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('main_guy', { frames: [1, 5, 9, 13] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('main_guy', { frames: [2, 6, 10, 14] }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('main_guy', { frames: [3, 7, 11, 15] }),
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

    handleAddPlayers(playerPositions: PlayerPosition[]) {
        this.otherPlayers = this.physics.add.group();
        playerPositions.forEach((playerPosition: PlayerPosition) => {
            if (playerPosition.connectionId === this.gameSocket.server_connnection_id) {
                this.addPlayer(playerPosition);
            } else {
                this.addOtherPlayers(playerPosition);
            }
        });

        this.map.createStaticLayer("Above Player", this.tileset, 0, 0);
        this.physics.add.overlap(this.mySprite, this.overlapObjectsGroup, this.handleOverlaps);
    }

    handleOverlaps = (mySprite: Phaser.GameObjects.Sprite, overlappedObject: Phaser.Physics.Arcade.Sprite & {body: Phaser.Physics.Arcade.Body}) => {
        // What happens when we overlap?
        // We can check the type attribute on the overlapped object and write up logic to handle an type we want.
        if(overlappedObject.type === 'SlowMotion') {
            this.velocity = 50;
        }
    }

    addPlayer(playerPosition: PlayerPosition) {
        const spawnPoint: any = this.map.findObject("SpawnPoints", (obj) => {
            return obj.name === playerPosition.spawnPoint;
        });
        this.mySprite = this.add.sprite(spawnPoint.x, spawnPoint.y, 'main_guy');
        this.cameras.main.startFollow(this.mySprite);
        this.cameras.main.setZoom(2);
        this.physics.add.existing(this.mySprite);
        this.physics.add.collider(this.mySprite, this.worldLayer);
        this.mySprite.body.setCollideWorldBounds(true);
        this.mySprite.body.onWorldBounds = true;
        const style = { font: "11px Courier", fill: "#00ff44" };
        this.myName = this.add.text(this.mySprite.x - 5, this.mySprite.y - 11, playerPosition.username, style);
    }

    addOtherPlayers(playerInfo: PlayerPosition) {
        const spawnPoint: any = this.map.findObject("SpawnPoints", (obj) => {
            return obj.name === playerInfo.spawnPoint;
        });
        const otherPlayer: Player = (this.add.sprite(spawnPoint.x, spawnPoint.y, 'main_guy') as Player);

        const style = { font: "11px Courier", fill: "#00ff44" };
        const text = this.add.text(otherPlayer.x - 5, otherPlayer.y - 11, playerInfo.username, style);
        this.otherNames.set(playerInfo.connectionId, text);
        otherPlayer.connectionId = playerInfo.connectionId;
        this.otherPlayers.add(otherPlayer);
    }

    handleOtherPlayerMoved(gameMessage) {
        if (!this.otherPlayers) return;

        this.otherPlayers.getChildren().forEach((otherPlayer) => {
            if (gameMessage.connectionId === otherPlayer.connectionId) {
                const thePlayerIsMovingLeft: boolean = gameMessage.x < otherPlayer.x;
                const thePlayerIsMovingRight: boolean = gameMessage.x > otherPlayer.x;
                const thePlayerIsMovingUp: boolean = gameMessage.y < otherPlayer.y;
                const thePlayerIsMovingDown: boolean = gameMessage.y > otherPlayer.y;

                if (thePlayerIsMovingDown) {
                    otherPlayer.anims.play('down', true);
                } else if (thePlayerIsMovingUp) {
                    otherPlayer.anims.play('up', true);
                }


                if (thePlayerIsMovingLeft) {
                    let animation = 'left';
                    if (thePlayerIsMovingUp) {
                        animation = 'up';
                    } else if (thePlayerIsMovingDown) {
                        animation = 'down';
                    }
                    otherPlayer.anims.play(animation, true);
                } else if (thePlayerIsMovingRight) {
                    let animation = 'right';
                    if (thePlayerIsMovingUp) {
                        animation = 'up';
                    } else if (thePlayerIsMovingDown) {
                        animation = 'down';
                    }
                    otherPlayer.anims.play(animation, true);
                }

                otherPlayer.setPosition(gameMessage.x, gameMessage.y);
                const otherPlayerName = this.otherNames.get(gameMessage.connectionId);
                otherPlayerName.x = otherPlayer.body.position.x - ((otherPlayerName.width / 2) - (otherPlayer.width / 2));
                otherPlayerName.y = otherPlayer.body.position.y - otherPlayerName.height;
            }
        });


    }


    handleOtherPlayerStopped(gameMessage) {
        if (!this.otherPlayers) return;

        this.otherPlayers.getChildren().forEach(function (otherPlayer) {
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
            this.mySprite.anims.play(animation, true);
        } else if (thePlayerIsMovingRight) {
            this.mySprite.body.setVelocityX(this.velocity);
            let animation = 'right';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }
            this.mySprite.anims.play(animation, true);
        }

        if (thePlayerIsMovingUp) {
            this.mySprite.body.setVelocityY(this.velocity * -1);
            this.mySprite.anims.play('up', true);
        } else if (thePlayerIsMovingDown) {
            this.mySprite.body.setVelocityY(this.velocity);
            this.mySprite.anims.play('down', true);
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
        this.myName.x = this.mySprite.body.position.x - ((this.myName.width / 2) - (this.mySprite.width / 2));
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

