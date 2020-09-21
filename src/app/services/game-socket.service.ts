import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";

@Injectable({
  providedIn: 'root'
})
export class GameSocketService {
  server_connnection_id: string = "";
  lobby_id: string = "";

  socket$: WebSocketSubject<any> = webSocket({
    url: 'ws://localhost:8080'
  });

  lobbyJoined$: Subject<string> = new Subject<string>();
  lobbyChatRecieved$: Subject<{sender: string, message: string}> = new Subject<{sender: string, message: string}>();

  constructor() {
    this.socket$.subscribe(
      this.handleMessage,
      err => console.log("ERROR: ", err),
      () => console.log("socket_connection_closed")
    );
  }


  handleMessage = (message) => {
    if (!message || !message.type) { return; }

    switch (message.type) {
      case "CONNECTED":
        this.server_connnection_id = message.connection_id;
        break;
      case "LOBBY_JOINED":
        this.lobby_id = message.lobby_id;
        this.lobbyJoined$.next(message.lobby_id);
        break;
      case "RECEIVE_LOBBY_CHAT":
        this.lobbyChatRecieved$.next({sender: message.sender, message: message.message});
        break;
    }
  }

  isConnected(): boolean {
    return this.socket$ && !this.socket$.closed;
  }

  isDisconnected(): boolean {
    return !this.isConnected();
  }

  joinRandomLobby() {
    this.socket$.next({ type: "JOIN_RANDOM_LOBBY" });
  }

  sendALobbyChatMessage(message) {
    this.socket$.next({ type: "SEND_LOBBY_CHAT", lobby_id: this.lobby_id, message: message });
  }

}
