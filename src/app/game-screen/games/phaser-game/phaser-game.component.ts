import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { GameSocketService } from 'src/app/services/game-socket.service';
import { GameScene } from './GameScene';


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
      height: "90%",
      width: "100%",
      scene: [new GameScene(this.gameSocket)],
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 } // Top down game, so no gravity
        }
      }
    };
  }

  ngOnInit() {
    this.phaserGame = new Phaser.Game(this.config);
  }
}
