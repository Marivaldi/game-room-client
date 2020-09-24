import { Component, OnInit } from '@angular/core';
import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';

@Component({
  selector: 'app-trivia-game',
  templateUrl: './trivia-game.component.html',
  styleUrls: ['./trivia-game.component.css']
})
export class TriviaGameComponent implements OnInit {
  youArePickingTheCategory: boolean = false;
  someoneElseIsPickingTheCategory: boolean = false;
  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.gameSocket.gameActionReceived$.subscribe((gameMessage) => {
      if (!gameMessage || !gameMessage.type) return;

      switch(gameMessage.type) {
        case TriviaGameMessageType.PICK_CATEGORY:
          this.youArePickingTheCategory = true;
          this.someoneElseIsPickingTheCategory = false;
          break;
        case TriviaGameMessageType.WAIT_FOR_CATEGORY:
          this.youArePickingTheCategory = false;
          this.someoneElseIsPickingTheCategory = true;
          break;
      }
    });

    this.gameSocket.pressPlay(GameKey.TRIVIA_GAME);
  }
}


enum TriviaGameMessageType {
  PICK_CATEGORY = "PICK_CATEGORY",
  WAIT_FOR_CATEGORY = "WAIT_FOR_CATEGORY",
  ANSWER_QUESTION = "ANSWER_QUESTION",
}