import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Observer } from 'rxjs';
import { GameKey } from '../models/enums/game-key';
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit, OnDestroy {
  lobby_id: string;
  activeGame: GameKey;
  aGameIsStarting: boolean = false;
  theGameHasStarted: boolean = false;
  showGameOverScreen: boolean = false;
  winners: string[] = [];
  showChat: boolean = false;
  joinLink: string = "";
  gameOverScreenTimeout;
  constructor(private router: Router, private route: ActivatedRoute, private gameSocket: GameSocketService) { }
  private routeSub: any;  // subscription to route observer

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.lobby_id = params['id'];
      this.joinLink = `${location.origin}/join/${this.lobby_id}`;
      const inTheRightLobby = this.inTheRightLobby(this.lobby_id);
      if (!inTheRightLobby) this.router.navigate(['/']);
    });

    this.gameSocket.gameStarting$.subscribe((gameKey: GameKey) => {
      this.aGameIsStarting = true;
      this.activeGame = gameKey;
      this.showGameOverScreen = false;
    });

    this.gameSocket.gameOver$.subscribe((winners: string[]) => {
      this.winners = winners;
      this.aGameIsStarting = false;
      this.activeGame = null;
      this.theGameHasStarted = false;
      this.showGameOverScreen = true;
      clearTimeout(this.gameOverScreenTimeout);
      this.gameOverScreenTimeout = setTimeout(() => {
        this.showGameOverScreen = false;
      }, 5000);
    });


    this.routeSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.gameSocket.leaveLobby();
      }
    });
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
  }

  onSwipeRight() {
    this.showChat = true;
  }

  closeChat() {
    this.showChat = false;
  }

  inTheRightLobby(lobbyId: string): boolean {
    return this.gameSocket.lobbyId === lobbyId;
  }

  startTheGame() {
    this.aGameIsStarting = false;
    this.theGameHasStarted = true;
    this.showGameOverScreen = false;
  }

  closeGameOverScreen() {
    clearTimeout(this.gameOverScreenTimeout);
    this.showGameOverScreen = false;
  }
}
