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
    overlapObjectsGroup: Phaser.Physics.Arcade.StaticGroup;
    private map: Phaser.Tilemaps.Tilemap;
    private tileset;
    private sentStopped: boolean = false;
    private myName: Phaser.GameObjects.Text;
    private otherNames: Map<string, Phaser.GameObjects.Text> = new Map<string, Phaser.GameObjects.Text>();
    constructor(private gameSocket: GameSocketService) {
        super(sceneConfig);
    }

    handleAddPlayers(playerPositions: PlayerPosition[]) {
        playerPositions.forEach((playerPosition: PlayerPosition) => {
            if (playerPosition.connectionId === this.gameSocket.server_connnection_id) {
                this.addPlayer(playerPosition);
            } else {
                this.addOtherPlayers(playerPosition);
            }
        });

        this.map.createStaticLayer("Above Player", this.tileset, 0, 0);
        this.physics.add.overlap(this.mySprite, this.overlapObjectsGroup, (o1, o2) => {
            // Handle when player is standing on overlap objects.
        }, null, this);
    }

    public preload() {
        this.load.spritesheet('main_guy', 'assets/Character.png', { frameHeight: 32, frameWidth: 32, endFrame: 15 });
        this.load.image("tiles", "/assets/castle.png");
        this.load.tilemapTiledJSON("map", "/assets/main_map_v2.json");
    }

    public create() {

        this.map = this.make.tilemap({ key: "map" });
        this.physics.world.bounds.setTo(0, 0, 416, 416);
        this.tileset = this.map.addTilesetImage("castle", "tiles");
        this.map.createStaticLayer("Below Player", this.tileset, 0, 0);
        this.worldLayer = this.map.createStaticLayer("World", this.tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });
        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // this.worldLayer.renderDebug(debugGraphics, {
        //   tileColor: null, // Color of non-colliding tiles
        //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        // });



        const overlapObjects = this.map.getObjectLayer('Objects').objects //my Object layer was called Overlap
        this.overlapObjectsGroup = this.physics.add.staticGroup({

        });

        overlapObjects.forEach(object => {
            if (object.type === "Stand Point") {
                let obj = this.overlapObjectsGroup.create(object.x, object.y, null, null, false);
                obj.setScale(object.width / 32, object.height / 32); //my tile size was 32
                obj.setOrigin(0); //the positioning was off, and B3L7 mentioned the default was 0.5
                obj.body.width = object.width; //body of the physics body
                obj.body.height = object.height;
            }
        });


        this.overlapObjectsGroup.refresh();

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

        this.gameSocket.gameActionReceived$.subscribe((gameMessage) => {
            if (!this.otherPlayers) { this.otherPlayers = this.physics.add.group(); }
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
        });

        this.gameSocket.pressPlay(GameKey.PHASER_GAME);

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
                otherPlayerName.x = otherPlayer.body.position.x - ((otherPlayerName.width/2) - (otherPlayer.width/2));
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

    public update() {
        if (!this.mySprite || !this.game.input.keyboard.enabled) return;

        this.mySprite.body.setVelocity(0);

        let thePlayerIsMovingLeft: boolean = false;
        let thePlayerIsMovingRight: boolean = false;
        let thePlayerIsMovingUp: boolean = false;
        let thePlayerIsMovingDown: boolean = false;
        const pointer = this.input.activePointer;
        const cursorKeys = this.input.keyboard.createCursorKeys();
        if (pointer.isDown) {
            thePlayerIsMovingLeft = pointer.worldX < Math.round(this.mySprite.x);
            thePlayerIsMovingRight = pointer.worldX > Math.round(this.mySprite.x);
            thePlayerIsMovingUp = pointer.worldY < Math.round(this.mySprite.y);
            thePlayerIsMovingDown = pointer.worldY > Math.round(this.mySprite.y);
        } else {
            thePlayerIsMovingLeft = cursorKeys.left.isDown;
            thePlayerIsMovingRight = cursorKeys.right.isDown;
            thePlayerIsMovingUp = cursorKeys.up.isDown;
            thePlayerIsMovingDown = cursorKeys.down.isDown;
        }

        if (thePlayerIsMovingLeft) {

            this.mySprite.body.setVelocityX(-100);
            let animation = 'left';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }

            this.mySprite.anims.play(animation, true);

        } else if (thePlayerIsMovingRight) {
            this.mySprite.body.setVelocityX(100);
            let animation = 'right';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }

            this.mySprite.anims.play(animation, true);
        }

        if (thePlayerIsMovingUp) {
            this.mySprite.body.setVelocityY(-100);
            this.mySprite.anims.play('up', true);
        } else if (thePlayerIsMovingDown) {
            this.mySprite.body.setVelocityY(100);
            this.mySprite.anims.play('down', true);
        }


        const x = this.mySprite.x;
        const y = this.mySprite.y;
        if (this.previousPosition && (x !== this.previousPosition.x || y !== this.previousPosition.y)) {
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
        } else {
            this.mySprite.anims.stop();
            if (!this.sentStopped) {
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
            }
            this.sentStopped = true;
        }

        this.myName.x = this.mySprite.body.position.x - ((this.myName.width/2) - (this.mySprite.width/2) );
        this.myName.y = this.mySprite.body.position.y - this.myName.height;

        // save old position data
        this.previousPosition = {
            x: this.mySprite.x,
            y: this.mySprite.y
        };
    }

    addPlayer(playerPosition: PlayerPosition) {
        const spawnPoint: any = this.map.findObject("Objects", (obj) => {
            return obj.name === "Spawn Point"
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
        const spawnPoint: any = this.map.findObject("Objects", (obj) => {
            return obj.name === "Spawn Point"
        });
        const otherPlayer: Player = (this.add.sprite(spawnPoint.x, spawnPoint.y, 'main_guy') as Player);

        const style = { font: "11px Courier", fill: "#00ff44" };
        const text = this.add.text(otherPlayer.x - 5, otherPlayer.y - 11, playerInfo.username, style);
        this.otherNames.set(playerInfo.connectionId, text);
        otherPlayer.connectionId = playerInfo.connectionId;
        this.otherPlayers.add(otherPlayer);
    }
}




class Player extends Phaser.GameObjects.Sprite {
    connectionId: string;
}

