import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit{
  lobby_id: string;
  timerInterval;
  waitingInterval;
  showCountdown: boolean = false;
  timeUntilGameStart: number = 10;
  waitingElipses: string = "";
  constructor(private router: Router, private route: ActivatedRoute, private gameSocket: GameSocketService) { }

  ngOnInit(): void {

    this.route.params.subscribe(params => {
      this.lobby_id = params['id'];
      const inTheRightLobby = this.inTheRightLobby(this.lobby_id);
      if(!inTheRightLobby) this.router.navigate(['/']);
    });

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
