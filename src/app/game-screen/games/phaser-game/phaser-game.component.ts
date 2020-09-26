import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';

@Component({
  selector: 'app-phaser-game',
  templateUrl: './phaser-game.component.html',
  styleUrls: ['./phaser-game.component.css']
})
export class PhaserGameComponent implements OnInit {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  constructor(private gameSocket: GameSocketService) {
    this.config = {
      type: Phaser.AUTO,
      height: 720,
      width: 1080,
      scene: [new GameScene(this.gameSocket)],
      parent: 'game-container',
      physics: {
        default: 'arcade'
      }
    };
  }

  ngOnInit() {
    this.phaserGame = new Phaser.Game(this.config);
  }
}


const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};

export class GameScene extends Phaser.Scene {
  private square: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private previousPosition: any = {};
  private otherPlayers;
  constructor(private gameSocket: GameSocketService) {
    super(sceneConfig);
  }

  handleAddPlayers(playerPositions: PlayerPosition[]){
    playerPositions.forEach((playerPosition: PlayerPosition) => {
      if(playerPosition.connectionId === this.gameSocket.server_connnection_id) {
        this.addPlayer(playerPosition);
      } else {
        this.addOtherPlayers(playerPosition);
      }
    })
  }

  public create() {
    this.gameSocket.gameActionReceived$.subscribe((gameMessage) => {
      if (!gameMessage || !gameMessage.type) return;

      switch (gameMessage.type) {
        case "ADD_PLAYERS":
          this.handleAddPlayers(gameMessage.players);
          break;
        case "PLAYER_MOVED":
          this.handleOtherPlayerMoved(gameMessage);
          break;
      }
    });



    this.otherPlayers = this.physics.add.group();
    this.gameSocket.pressPlay(GameKey.PHASER_GAME);
   }

  handleOtherPlayerMoved(gameMessage) {
    this.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (gameMessage.connectionId === otherPlayer.connectionId) {
        otherPlayer.setPosition(gameMessage.x, gameMessage.y);
      }
    });
  }

  public update() {
    if(!this.square) return;
    const cursorKeys = this.input.keyboard.createCursorKeys();

    if (cursorKeys.up.isDown) {
      this.square.body.setVelocityY(-500);
    } else if (cursorKeys.down.isDown) {
      this.square.body.setVelocityY(500);
    } else {
      this.square.body.setVelocityY(0);
    }

    if (cursorKeys.right.isDown) {
      this.square.body.setVelocityX(500);
    } else if (cursorKeys.left.isDown) {
      this.square.body.setVelocityX(-500);
    } else {
      this.square.body.setVelocityX(0);
    }


    // emit player movement
    const x = this.square.x;
    const y = this.square.y;
    if (this.previousPosition && (x !== this.previousPosition.x || y !== this.previousPosition.y)) {
      console.log("Sending updated position");
      this.gameSocket.socket$.next({
        type: "GAME_ACTION",
        gameKey: GameKey.PHASER_GAME,
        lobbyId: this.gameSocket.lobbyId,
        connectionId: this.gameSocket.server_connnection_id,
        gameMessage: {
          type: "PLAYER_MOVED",
          connectionId: this.gameSocket.server_connnection_id,
          x: this.square.x,
          y: this.square.y
        }
      });
    }

    // save old position data
    this.previousPosition = {
      x: this.square.x,
      y: this.square.y
    };
  }

  addPlayer(playerInfo) {
    this.square = this.add.rectangle(400, 400, 100, 100, 0xFFFFFF) as any;
    this.cameras.main.startFollow(this.square);
    this.physics.add.existing(this.square);
  }

  addOtherPlayers(playerInfo) {
    const otherPlayer: Player = (this.add.rectangle(400, 400, 100, 100, 0xFFFFFF) as Player);

    otherPlayer.connectionId = playerInfo.connectionId;
    this.otherPlayers.add(otherPlayer);
  }
}

class PlayerPosition {
  connectionId: string;
  x: number;
  y: number;
}


class Player extends Phaser.GameObjects.Rectangle {
  connectionId: string;
}

