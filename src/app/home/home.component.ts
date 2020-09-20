import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  socket$: WebSocketSubject<any> = webSocket({
    url: 'ws://localhost:8080'
  });

  server_connnection_id: string = "";

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.socket$.subscribe(
      this.handleMessage,
      err => console.log("ERROR: ", err),
      () => console.log("socket_connection_closed")
    );
  }

  joinRandomLobby() {
    if (!this.socket$ || this.socket$.closed) { return; }

    this.socket$.next({ type: "JOIN_RANDOM_LOBBY"});
  }

  handleMessage = (message) => {
    if(!message || !message.type) { return; }

    switch(message.type) {
      case "CONNECTED":
        this.server_connnection_id = message.connection_id;
        break;
      case "LOBBY_JOINED":
        console.log(`YAY! You've joined LOBBY: ${message.lobby_id}`);
        this.goToLobby(message.lobby_id);
        break;
    }
  }


  goToLobby(id: string) {
    this.router.navigate(['/lobby', id]);
  }
}