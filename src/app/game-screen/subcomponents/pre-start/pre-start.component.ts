import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GameSocketService } from 'src/app/services/game-socket.service';

@Component({
  selector: 'app-pre-start',
  templateUrl: './pre-start.component.html',
  styleUrls: ['./pre-start.component.css']
})
export class PreStartComponent implements OnInit {
  timerInterval;
  waitingInterval;
  showCountdown: boolean = false;
  timeUntilGameStart: number = 10;
  waitingElipses: string = "";
  @Output() startTheGame = new EventEmitter();
  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.timeUntilGameStart = 10;
    this.startTimer();
  }

  inTheRightLobby(lobbyId: string): boolean {
    return this.gameSocket.lobbyId === lobbyId;
  }

  startTimer() {
    clearInterval(this.waitingInterval);
    this.showCountdown = true;
    this.timerInterval = setInterval(() => {
      if(this.timeUntilGameStart > 1) {
        this.timeUntilGameStart--;
      } else {
        clearInterval(this.timerInterval);
        this.startTheGame.emit();
      }
    },1000)
  }

  startWaiting() {
    this.waitingInterval = setInterval(() => {
      if(this.waitingElipses.length === 3) {
         this.waitingElipses = "";
      } else {
        this.waitingElipses += ".";
      }
    }, 500);
  }
}
