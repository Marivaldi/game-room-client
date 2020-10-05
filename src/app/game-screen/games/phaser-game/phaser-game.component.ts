import { Component, Input, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { GameSocketService } from 'src/app/services/game-socket.service';
import { GameScene } from './GameScene';
import { HUDScene } from './HUDScene';
import { Player } from './Player';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { GameKey } from 'src/app/models/enums/game-key';


@Component({
  selector: 'app-phaser-game',
  templateUrl: './phaser-game.component.html',
  styleUrls: ['./phaser-game.component.css']
})
export class PhaserGameComponent implements OnInit {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  gameScene: GameScene = new GameScene(this.gameSocket);
  hudScene: HUDScene = new HUDScene();
  playerState: (Player & { votes: number, isMe: boolean })[] = [];
  voting: boolean = false;
  @Input() set disableGameInput(disabled: boolean) {
    if (!this.phaserGame) return;

    if (disabled) {
      this.disableGame();
    } else {
      this.enableGame();
    }
  }

  constructor(private gameSocket: GameSocketService) {
    this.config = {
      type: Phaser.AUTO,
      height: "90%",
      width: "100%",
      scene: [this.gameScene, this.hudScene],
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: true
        }
      },
      plugins: {
        global: [{
          key: 'rexVirtualJoystick',
          plugin: VirtualJoystickPlugin,
          start: true
        }]
      }
    };
  }

  ngOnInit() {
    this.phaserGame = new Phaser.Game(this.config);

    this.phaserGame.events.addListener(Phaser.Core.Events.BLUR, () => {
      this.disableGame();
    });

    this.phaserGame.events.addListener(Phaser.Core.Events.FOCUS, () => {
      this.enableGame();
    });

    this.phaserGame.events.addListener(Phaser.Core.Events.HIDDEN, () => {
      this.disableGame();
    });

    this.gameSocket.gameActionReceived$.subscribe(this.handleMessage);
  }

  handleMessage = (gameMessage) => {
    console.log(gameMessage);
    if (!gameMessage || !gameMessage.type) return;

    switch (gameMessage.type) {
      case "START_VOTE":
        this.launchVote();
        break;
      case "UPDATE_VOTES":
        this.updateVotes(gameMessage.votes);
        break;
    }
  }

  updateVotes(votes: any) {
    for (let i = 0; i < this.playerState.length; i++) {
      if (!votes.hasOwnProperty(this.playerState[i].connectionId)) {
        this.playerState[i].votes = 0;
        continue;
      }

      this.playerState[i].votes = votes[this.playerState[i].connectionId];
    }
  }

  getCurrentPlayerState() {
    this.playerState = [];
    for (let otherPlayer of this.gameScene.playerManager.otherPlayers.values()) {
      const player = otherPlayer as (Player & { votes: number, isMe: boolean });
      player.isMe = false;
      this.playerState.push(player);
    }

    const me = this.gameScene.playerManager.player as (Player & { votes: number , isMe: boolean});
    me.isMe = true;
    this.playerState.push(me);
  }

  launchVote() {
    this.getCurrentPlayerState();
    this.voting = true;
    this.disableGame();
  }

  iAmStillAlive(): boolean {
    return this.gameScene.playerManager.player.alive;
  }

  endVote() {
    this.voting = false;
    this.enableGame();
  }

  voteFor(connectionId: string) {
    this.gameSocket.socket$.next({
      type: "GAME_ACTION",
      gameKey: GameKey.PHASER_GAME,
      lobbyId: this.gameSocket.lobbyId,
      connectionId: this.gameSocket.server_connnection_id,
      gameMessage: {
        type: "VOTE_PLAYER",
        voter: this.gameSocket.server_connnection_id,
        votedFor: connectionId
      }
    });
  }

  disableGame() {
    this.phaserGame.input.keyboard.enabled = false;
    this.phaserGame.input.mouse.enabled = false;
    if (this.phaserGame.input.touch) this.phaserGame.input.touch.enabled = false;
    this.phaserGame.canvas.blur();
    this.phaserGame.scene.pause('Game');
  }

  enableGame() {
    this.phaserGame.input.keyboard.enabled = true;
    this.phaserGame.input.mouse.enabled = true;
    if (this.phaserGame.input.touch) this.phaserGame.input.touch.enabled = true;
    this.phaserGame.canvas.focus();
    this.phaserGame.scene.resume('Game');
  }
}
