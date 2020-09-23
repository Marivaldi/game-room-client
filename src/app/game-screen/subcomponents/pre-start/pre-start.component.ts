import { Component, OnInit } from '@angular/core';
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
  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.gameSocket.gameStart$.subscribe(() => this.startTimer());

    this.startWaiting();
  }

  inTheRightLobby(lobbyId: string): boolean {
    return this.gameSocket.lobbyId === lobbyId;
  }

  startTimer() {
    clearInterval(this.waitingInterval);
    this.showCountdown = true;
    this.timerInterval = setInterval(() => {
      if(this.timeUntilGameStart > 0) {
        this.timeUntilGameStart--;
      } else {
        clearInterval(this.timerInterval);
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
