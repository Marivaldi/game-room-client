import { Component, OnInit } from '@angular/core';
import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';

@Component({
  selector: 'app-test-game',
  templateUrl: './test-game.component.html',
  styleUrls: ['./test-game.component.css']
})
export class TestGameComponent implements OnInit {

  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {

  }

  winTheGame() {
    this.gameSocket.socket$.next({
      type: "GAME_ACTION",
      gameKey: GameKey.TEST_GAME,
      lobbyId: this.gameSocket.lobbyId,
      connectionId: this.gameSocket.server_connnection_id,
      gameMessage: {
        type: "FIRST_CLICK",
        connectionId: this.gameSocket.server_connnection_id
      }
    });
  }

}
