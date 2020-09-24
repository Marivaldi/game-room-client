import { Component, OnInit } from '@angular/core';
import { GameKey } from 'src/app/models/enums/game-key';
import { GameSocketService } from 'src/app/services/game-socket.service';
import shuffle from 'shuffle-array';

@Component({
  selector: 'app-trivia-game',
  templateUrl: './trivia-game.component.html',
  styleUrls: ['./trivia-game.component.css']
})
export class TriviaGameComponent implements OnInit {
  youArePickingTheCategory: boolean = false;
  someoneElseIsPickingTheCategory: boolean = false;
  showQuestion: boolean = false;
  showResult: boolean = false;
  currentQuestion: TriviaQuestion;
  answers: string[] = [];
  selectedAnswerIndex: number = null;
  categoryPicker: string = "";
  answerInterval;
  resultTimeout;
  timeLeftToAnswer: number = 20;
  get percentage(): number {
    return (this.timeLeftToAnswer / 20) * 100;
  }
  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.selectedAnswerIndex = null;
    this.gameSocket.gameActionReceived$.subscribe((gameMessage) => {
      if (!gameMessage || !gameMessage.type) return;

      switch (gameMessage.type) {
        case TriviaGameMessageType.PICK_CATEGORY:
          this.youArePickingTheCategory = true;
          this.someoneElseIsPickingTheCategory = false;
          this.showResult = false;
          break;
        case TriviaGameMessageType.WAIT_FOR_CATEGORY:
          this.youArePickingTheCategory = false;
          this.someoneElseIsPickingTheCategory = true;
          this.showResult = false;
          this.categoryPicker = gameMessage.picker;
          break;
        case TriviaGameMessageType.SHOW_QUESTION:
          this.timeLeftToAnswer = 20;
          this.selectedAnswerIndex = null;
          this.handleShowQuestion(gameMessage);
          this.showQuestion = true;
          this.youArePickingTheCategory = false;
          this.someoneElseIsPickingTheCategory = false;
      }
    });

    this.gameSocket.pressPlay(GameKey.TRIVIA_GAME);
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

  radioChecked(answers, i) {
    this.selectedAnswerIndex = i;
  }

  selectedAnswerIsCorrect(): boolean {
    if (this.selectedAnswerIndex === null) return false;
    const answer: string = this.answers[this.selectedAnswerIndex];
    console.log(answer);
    console.log(this.currentQuestion.correct_answer);
    return answer === this.currentQuestion.correct_answer;
  }

  private handleShowQuestion(gameMessage) {
    const response: TriviaQuestionsReponse = gameMessage.triviaQuestion as TriviaQuestionsReponse;
    const triviaQuestion: TriviaQuestion = response.results[0];
    this.setCurrentQuestion(triviaQuestion);
    clearInterval(this.answerInterval);
    this.answerInterval = setInterval(() => {
      console.log(this.timeLeftToAnswer);
      if (this.timeLeftToAnswer > 0) {
        this.timeLeftToAnswer--;
      } else {
        this.showResult = true;
        this.showQuestion = false;
        clearInterval(this.answerInterval);
        setTimeout(() => {
          this.sendAnswer();
        }, 5000)
      }
    }, 1000)
  }

  private sendAnswer() {
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

  private setCurrentQuestion(triviaQuestion: TriviaQuestion) {
    this.currentQuestion = triviaQuestion;
    if (triviaQuestion.type === "boolean") {
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