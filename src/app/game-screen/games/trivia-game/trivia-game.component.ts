import { Component, OnInit } from '@angular/core';
import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';
import  shuffle from 'shuffle-array';

@Component({
  selector: 'app-trivia-game',
  templateUrl: './trivia-game.component.html',
  styleUrls: ['./trivia-game.component.css']
})
export class TriviaGameComponent implements OnInit {
  youArePickingTheCategory: boolean = false;
  someoneElseIsPickingTheCategory: boolean = false;
  showQuestion: boolean = false;
  currentQuestion: TriviaQuestion;
  answers: string[] = [];
  selectedAnswerIndex: number = null;
  categoryPicker: string = "";
  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.gameSocket.gameActionReceived$.subscribe((gameMessage) => {
      if (!gameMessage || !gameMessage.type) return;

      switch (gameMessage.type) {
        case TriviaGameMessageType.PICK_CATEGORY:
          this.youArePickingTheCategory = true;
          this.someoneElseIsPickingTheCategory = false;
          break;
        case TriviaGameMessageType.WAIT_FOR_CATEGORY:
          this.youArePickingTheCategory = false;
          this.someoneElseIsPickingTheCategory = true;
          this.categoryPicker = gameMessage.picker;
          break;
        case TriviaGameMessageType.SHOW_QUESTION:
          this.handleShowQuestion(gameMessage);
          this.showQuestion = true;
          this.youArePickingTheCategory = false;
          this.someoneElseIsPickingTheCategory = false;
      }
    });

    this.gameSocket.pressPlay(GameKey.TRIVIA_GAME);

    setTimeout(() => {
      if(this.youArePickingTheCategory) this.sendCategoryPicked(10);
    }, 5000)
  }

  sendCategoryPicked(category: number) {
    this.gameSocket.socket$.next({
      type: "GAME_ACTION",
      gameKey: GameKey.TEST_GAME,
      lobbyId: this.gameSocket.lobbyId,
      connectionId: this.gameSocket.server_connnection_id,
      gameMessage: {
        type: TriviaGameMessageType.CATEGORY_PICKED,
        category: category
      }
    });
  }

  radioChecked(answers, i){
    this.selectedAnswerIndex = i;
  }

  private handleShowQuestion(gameMessage) {
    const response: TriviaQuestionsReponse = gameMessage.triviaQuestion as TriviaQuestionsReponse;
    const triviaQuestion: TriviaQuestion = response.results[0];
    this.setCurrentQuestion(triviaQuestion);
    setTimeout(() => {
      this.sendAnswer();
    }, 10000)
  }

  private sendAnswer() {
    console.log("sending answer");
    console.log("Correct? ", this.selectedAnswerIsCorrect());
    this.gameSocket.socket$.next({
      type: "GAME_ACTION",
      gameKey: GameKey.TEST_GAME,
      lobbyId: this.gameSocket.lobbyId,
      connectionId: this.gameSocket.server_connnection_id,
      gameMessage: {
        type: TriviaGameMessageType.ANSWER_QUESTION,
        answerWasCorrect: this.selectedAnswerIsCorrect(),
        connectionId: this.gameSocket.server_connnection_id
      }
    });
  }

  private selectedAnswerIsCorrect(): boolean {
    const answer : string = this.answers[this.selectedAnswerIndex];
    return answer === this.currentQuestion.correct_answer;
  }

  private setCurrentQuestion(triviaQuestion: TriviaQuestion) {
    this.currentQuestion = triviaQuestion;
    if(triviaQuestion.type === "boolean") {
      this.answers = ["True", "False"];
      return;
    }

    this.answers = triviaQuestion.incorrect_answers;
    this.answers.push(triviaQuestion.correct_answer);
    shuffle(this.answers);
  }
}


enum TriviaGameMessageType {
  PICK_CATEGORY = "PICK_CATEGORY",
  WAIT_FOR_CATEGORY = "WAIT_FOR_CATEGORY",
  CATEGORY_PICKED = "CATEGORY_PICKED",
  SHOW_QUESTION = "SHOW_QUESTION",
  ANSWER_QUESTION = "ANSWER_QUESTION"
}

class TriviaQuestionsReponse {
  response_code: number;
  results: TriviaQuestion[];
}

class TriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string
  correct_answer: string;
  incorrect_answers: string[];
}