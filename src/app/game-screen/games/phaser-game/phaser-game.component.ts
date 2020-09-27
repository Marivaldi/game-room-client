import { Component, Input, OnInit } from '@angular/core';
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

    this.phaserGame.events.addListener(Phaser.Core.Events.BLUR, () =>{
      this.disableGame();
    });

    this.phaserGame.events.addListener(Phaser.Core.Events.FOCUS, () =>{
      this.enableGame();
    });

    this.phaserGame.events.addListener(Phaser.Core.Events.HIDDEN, () =>{
      this.disableGame();
    });
  }

  disableGame() {
    this.phaserGame.input.keyboard.enabled = false;
    this.phaserGame.input.mouse.enabled = false;
    if (this.phaserGame.input.touch) this.phaserGame.input.touch.enabled = false;
    this.phaserGame.canvas.blur();
  }

  enableGame() {
    this.phaserGame.input.keyboard.enabled = true;
    this.phaserGame.input.mouse.enabled = true;
    if (this.phaserGame.input.touch) this.phaserGame.input.touch.enabled = true;
  }
}
