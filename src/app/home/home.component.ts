import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  constructor(private router: Router, private gameSocket: GameSocketService) {}

  ngOnInit(): void {
    this.gameSocket.lobbyJoined$.subscribe((lobby_id: string) => this.goToLobby(lobby_id));
  }

  joinRandomLobby() {
    if (this.gameSocket.isDisconnected()) { return; }

    this.gameSocket.joinRandomLobby();
  }

  goToLobby(id: string) {
    this.router.navigate(['/lobby', id]);
  }
}