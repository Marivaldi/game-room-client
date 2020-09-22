import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameSocketService {
  server_connnection_id: string = "";
  lobbyId: string = "";

  socket$: WebSocketSubject<any> = webSocket({
    url: environment.socketURL
  });

  lobbyJoined$: Subject<string> = new Subject<string>();
  lobbyChatRecieved$: Subject<{sender: string, is_from_me: boolean, is_system_message: boolean,  message: string}> = new Subject<{sender: string, is_from_me: boolean, is_system_message: boolean,  message: string}>();
  gameStart$: Subject<any> = new Subject<any>();
  userIsTyping$: Subject<any> = new Subject<any>();
  userStoppedTyping$: Subject<any> = new Subject<any>();

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
        this.server_connnection_id = message.connectionId;
        break;
      case "LOBBY_JOINED":
        this.lobbyId = message.lobbyId;
        this.lobbyJoined$.next(message.lobbyId);
        break;
      case "RECEIVE_LOBBY_CHAT":
        this.lobbyChatRecieved$.next({sender: message.sender, is_from_me: this.isCurrentConnection(message.senderId), is_system_message: this.isSystemMessage(message.senderId), message: message.content});
        break;
      case "GAME_START":
        this.gameStart$.next();
        break;
      case "USER_IS_TYPING":
        this.userIsTyping$.next();
        break;
      case "USER_STOPPED_TYPING":
        this.userStoppedTyping$.next();
        break;
    }
  }

  isConnected(): boolean {
    return this.socket$ && !this.socket$.closed;
  }

  isSystemMessage(connection_id): boolean {
    return connection_id === "SYSTEM";
  }

  isDisconnected(): boolean {
    return !this.isConnected();
  }

  joinRandomLobby(username: string) {
    this.socket$.next({ type: "JOIN_RANDOM_LOBBY", username: username, connectionId: this.server_connnection_id });
  }

  sendALobbyChatMessage(message) {
    this.socket$.next({ type: "SEND_LOBBY_CHAT", connectionId: this.server_connnection_id, lobbyId: this.lobbyId, content: message });
  }

  isCurrentConnection(connection_id: string) {
    return this.server_connnection_id === connection_id;
  }

  startTyping() {
    this.socket$.next({ type: "USER_IS_TYPING", connectionId: this.server_connnection_id, lobbyId: this.lobbyId});
  }

  stopTyping() {
    this.socket$.next({ type: "USER_STOPPED_TYPING", connectionId: this.server_connnection_id, lobbyId: this.lobbyId});
  }
}
