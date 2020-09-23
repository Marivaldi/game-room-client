import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameKey } from '../models/enums/game-key';
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit{
  lobby_id: string;
  activeGame: GameKey;
  aGameIsStarting: boolean = false;
  theGameHasStarted: boolean = false;
  constructor(private router: Router, private route: ActivatedRoute, private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.lobby_id = params['id'];
      const inTheRightLobby = this.inTheRightLobby(this.lobby_id);
      if(!inTheRightLobby) this.router.navigate(['/']);
    });

    this.gameSocket.gameStarting$.subscribe((gameKey: GameKey) => {
      this.aGameIsStarting = true;
      this.activeGame = gameKey;
    });
  }

  inTheRightLobby(lobbyId: string): boolean {
    return this.gameSocket.lobbyId === lobbyId;
  }

  startTheGame() {
    this.aGameIsStarting = false;
    this.theGameHasStarted = true;
  }
}
