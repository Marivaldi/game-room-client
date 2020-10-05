import { GameScene } from './GameScene';
import { ObjectType } from './ObjectType';
import { Player } from './Player';
import { PlayerInformation } from './PlayerInformation';
import { PlayerRoles } from './PlayerRoles';

export class PlayerManager {
    player: Player;
    otherPlayers: Map<string, Player> = new Map<string, Player>();
    deadPlayers: Map<string, Player> = new Map<string, Player>();
    previousPosition: { x: number, y: number } = { x: 0, y: 0 }
    playersInRange: string[] = [];
    deadInRange: string[] = [];
    private otherPlayersGroup: Phaser.Physics.Arcade.Group;
    private deadPlayersGroup: Phaser.Physics.Arcade.Group;
    private attackIsCoolingDown: boolean = false;

    constructor(public scene: GameScene) {
        this.otherPlayersGroup = scene.physics.add.group();
        this.deadPlayersGroup = scene.physics.add.group();
    }

    handleAddPlayers(playerPositions: PlayerInformation[]) {
        playerPositions.forEach((playerInformation: PlayerInformation) => {
            if (playerInformation.connectionId === this.scene.gameSocket.server_connnection_id) {
                this.scene.playerManager.addPlayer(playerInformation);
            } else {
                this.scene.playerManager.addOtherPlayers(playerInformation, 'default_player');
            }
        });


        this.scene.physics.add.overlap(this.scene.playerManager.player.sprite, this.scene.overlapObjectsGroup, this.scene.handleOverlaps);
    }

    addPlayer(playerInfo: PlayerInformation) {
        this.player = new Player(playerInfo.connectionId, playerInfo.role);
        const spawnPoint: any = this.scene.map.findObject("SpawnPoints", (obj) => obj.name === playerInfo.spawnPoint);
        this.player.sprite = (this.scene.add.sprite(spawnPoint.x, spawnPoint.y, this.player.role) as Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body });
        this.player.sprite.setScale(0.5)
        this.scene.cameras.main.startFollow(this.player.sprite);
        this.scene.cameras.main.setZoom(2);
        this.scene.physics.add.existing(this.player.sprite);
        this.scene.physics.add.collider(this.player.sprite, this.scene.worldLayer);
        this.player.sprite.body.setCollideWorldBounds(true);
        const style = { font: "11px Courier", fill: "#00ff44" };
        this.player.name = this.scene.add.text(this.player.sprite.x - 5, this.player.sprite.y - 11, playerInfo.username, style);
        this.player.sprite.setDepth(3);
        this.scene.events.emit('isAKillingRole', this.player.isAKillingRole());
    }

    stopPlayer() {
        this.player.sprite.body.setVelocity(0);
    }

    stopPlayerAnimations() {
        this.player.sprite.anims.stop();
    }

    addOtherPlayers(playerInfo: PlayerInformation, spriteKey: string) {
        const otherPlayer: Player = new Player(playerInfo.connectionId, playerInfo.role);
        const spawnPoint: any = this.scene.map.findObject("SpawnPoints", (obj) => obj.name === playerInfo.spawnPoint);

        const sprite = (this.scene.add.sprite(spawnPoint.x, spawnPoint.y, spriteKey) as Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body });
        sprite.setScale(0.5);
        sprite.setDepth(2);
        this.otherPlayersGroup.add(sprite);
        otherPlayer.sprite = sprite;

        const style = { font: "11px Courier", fill: "#00ff44" };
        otherPlayer.name = this.scene.add.text(otherPlayer.sprite.body.position.x - 5, otherPlayer.sprite.body.position.y - 11, playerInfo.username, style);

        const overLapArea = this.scene.overlapObjectsGroup.create(otherPlayer.sprite.x, otherPlayer.sprite.y, null, null, false);
        overLapArea.type = "OtherPlayer"
        overLapArea.name = playerInfo.connectionId;
        overLapArea.body.width = otherPlayer.sprite.body.width;
        overLapArea.body.height = otherPlayer.sprite.body.height;
        otherPlayer.overlapArea = overLapArea;

        this.otherPlayers.set(playerInfo.connectionId, otherPlayer);
    }

    updatePreviousPosition() {
        this.previousPosition = {
            x: this.player.sprite.x,
            y: this.player.sprite.y
        };
    }

    mySpriteHasMoved() {
        return this.previousPosition && (this.player.sprite.x !== this.previousPosition.x || this.player.sprite.y !== this.previousPosition.y);
    }

    handlePlayerMovement(thePlayerIsMovingLeft: boolean, thePlayerIsMovingRight: boolean, thePlayerIsMovingDown: boolean, thePlayerIsMovingUp: boolean) {
        if (thePlayerIsMovingLeft) {
            this.player.sprite.body.setVelocityX(this.scene.velocity * -1);
            let animation = 'left';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }

            this.player.sprite.anims.play(this.player.role + "_" + animation, true);
        } else if (thePlayerIsMovingRight) {
            this.player.sprite.body.setVelocityX(this.scene.velocity);
            let animation = 'right';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }
            this.player.sprite.anims.play(this.player.role + "_" + animation, true);
        }

        if (thePlayerIsMovingUp) {
            this.player.sprite.body.setVelocityY(this.scene.velocity * -1);
            this.player.sprite.anims.play(this.player.role + '_up', true);
        } else if (thePlayerIsMovingDown) {
            this.player.sprite.body.setVelocityY(this.scene.velocity);
            this.player.sprite.anims.play(this.player.role + '_down', true);
        }
    }

    moveMyNameToMatchMyNewPosition() {
        this.player.name.x = this.player.sprite.body.position.x - ((this.player.name.width / 2) - (this.player.sprite.displayWidth / 2));
        this.player.name.y = this.player.sprite.body.position.y - this.player.name.height;
    }

    handleOtherPlayerMoved(gameMessage) {
        if (!this.otherPlayers) return;

        const otherPlayer = this.otherPlayers.get(gameMessage.connectionId);
        if (!otherPlayer) return;

        const thePlayerIsMovingLeft: boolean = gameMessage.x < otherPlayer.sprite.x;
        const thePlayerIsMovingRight: boolean = gameMessage.x > otherPlayer.sprite.x;
        const thePlayerIsMovingUp: boolean = gameMessage.y < otherPlayer.sprite.y;
        const thePlayerIsMovingDown: boolean = gameMessage.y > otherPlayer.sprite.y;

        if (thePlayerIsMovingDown) {
            otherPlayer.sprite.anims.play('default_player_down', true);
        } else if (thePlayerIsMovingUp) {
            otherPlayer.sprite.anims.play('default_player_up', true);
        }


        if (thePlayerIsMovingLeft) {
            let animation = 'left';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }
            otherPlayer.sprite.anims.play("default_player_" + animation, true);
        } else if (thePlayerIsMovingRight) {
            let animation = 'right';
            if (thePlayerIsMovingUp) {
                animation = 'up';
            } else if (thePlayerIsMovingDown) {
                animation = 'down';
            }
            otherPlayer.sprite.anims.play("default_player_" + animation, true);
        }

        otherPlayer.sprite.setPosition(gameMessage.x, gameMessage.y);

        otherPlayer.name.x = otherPlayer.sprite.body.position.x - ((otherPlayer.name.width / 2) - (otherPlayer.sprite.displayWidth / 2));
        otherPlayer.name.y = otherPlayer.sprite.body.position.y - otherPlayer.name.height;

        otherPlayer.overlapArea.x = otherPlayer.sprite.x
        otherPlayer.overlapArea.y = otherPlayer.sprite.y
        this.scene.overlapObjectsGroup.refresh();
    }

    handleOtherPlayerStopped(gameMessage) {
        if (!this.otherPlayers) return;

        const otherPlayer = this.otherPlayers.get(gameMessage.connectionId);
        if (!otherPlayer) return;

        otherPlayer.sprite.anims.stop();
    }

    attackPlayer(connectionId: string) {
        console.log(`Attacking Player ${connectionId}`);
        this.attackIsCoolingDown = true;
        setTimeout(() => {
            this.attackIsCoolingDown = false;
            console.log("Attack done cooling down");
        }, 5000);

        this.scene.socketManager.sendKillPlayerMessage(connectionId);
    }

    killPlayer(connectionId: string) {
        if(connectionId === this.player.connectionId){
            this.killMe();
            return;
        }

        if (!this.otherPlayers) return;

        const otherPlayer = this.otherPlayers.get(connectionId);
        if (!otherPlayer) return;

        const deadPlayer = new Player(otherPlayer.connectionId, otherPlayer.role);
        const deadSprite = this.addDeadSprite(otherPlayer.sprite.x, otherPlayer.sprite.y, connectionId);
        deadPlayer.sprite = (deadSprite as Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body });
        deadPlayer.name = otherPlayer.name.setColor('#8B0000');
        otherPlayer.overlapArea.type = ObjectType.DEAD_PLAYER;
        deadPlayer.overlapArea = otherPlayer.overlapArea;

        otherPlayer.sprite.anims.stop();
        otherPlayer.sprite.destroy();
        this.playersInRange.filter((inRangeConnectionId) => connectionId !== inRangeConnectionId);
        this.otherPlayers.delete(connectionId);
    }

    killMe() {
        const x = this.player.sprite.x;
        const y = this.player.sprite.y;
        this.player.sprite.destroy();
        this.player.sprite =  (this.scene.add.sprite(x, y, 'dead') as Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body });
        this.player.sprite.setScale(0.5)
        this.scene.cameras.main.startFollow(this.player.sprite);
        this.scene.cameras.main.setZoom(2);
        this.scene.physics.add.existing(this.player.sprite);
        this.scene.physics.add.collider(this.player.sprite, this.scene.worldLayer);
        this.player.sprite.body.setCollideWorldBounds(true);
        this.player.sprite.setDepth(3);
        this.player.role = PlayerRoles.DEAD;
    }

    addDeadSprite(x: number, y: number, connectionId: string) {
        const deadSprite = this.scene.add.sprite(x, y, 'dead');
        deadSprite.setScale(0.5);
        deadSprite.setDepth(1);
        this.deadPlayersGroup.add(deadSprite);
        return deadSprite;
    }
}