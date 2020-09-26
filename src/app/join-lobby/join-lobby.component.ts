import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-join-lobby',
  templateUrl: './join-lobby.component.html',
  styleUrls: ['./join-lobby.component.css']
})
export class JoinLobbyComponent implements OnInit {
  username: string = "";
  lobbyId: string = "";
  lobbyFromLink: boolean = false;

  constructor(private router: Router, private route: ActivatedRoute,  private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.lobbyFromLink = false;
    this.route.params.subscribe(params => {
      this.lobbyId = params['id'];
      this.lobbyFromLink = (!!this.lobbyId && this.lobbyId !== "")
    });
    this.gameSocket.lobbyJoined$.subscribe((lobby_id: string) => this.goToLobby(lobby_id));
  }

  joinLobby() {
    if (this.gameSocket.isDisconnected()) { return; }

    this.gameSocket.joinLobby(this.username, this.lobbyId);
    this.username = "";
  }

  createPrivateLobby() {
    if (this.gameSocket.isDisconnected()) { return; }

    this.gameSocket.createAndJoinPrivateLobby(this.username);
    this.username = "";
  }

  goToLobby(id: string) {
    this.router.navigate(['/lobby', id]);
  }

  updateUsername(username) {
    this.username = username;
  }

  updateLobbyId(lobbyId) {
    this.lobbyId = lobbyId;
  }
}
