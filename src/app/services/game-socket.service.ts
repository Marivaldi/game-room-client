import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';
import { GameKey } from '../models/enums/game-key';
import { Game } from '../models/game';
import { GameVote } from '../models/game-vote';

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
  lobbyChatRecieved$: Subject<ChatMessage> = new Subject<ChatMessage>();
  gameStarting$: Subject<GameKey> = new Subject<GameKey>();
  userIsTyping$: Subject<any> = new Subject<any>();
  userStoppedTyping$: Subject<any> = new Subject<any>();
  updateGameVotes$: Subject<GameVote[]> = new Subject<GameVote[]>();
  gameOver$: Subject<string[]> = new Subject<string[]>();
  gameActionReceived$: Subject<any> = new Subject<any>();
  heartbeatInterval;
  isLobbyHost: boolean = false;

  constructor() {
    this.connectToSocketServer();
  }


  connectToSocketServer() {
    this.socket$.subscribe(
      this.handleMessage,
      this.showErrorAndReconnect,
      this.logDisconnect
    );
  }

  showErrorAndReconnect = (err) => {
    console.log("ERROR: ", err);
    this.connectToSocketServer();
  }

  logDisconnect = () => {
    console.log("Socket Connection Closed");
  }

  handleMessage = (message) => {
    if (!message || !message.type) { return; }

    switch (message.type) {
      case "CONNECTED":
        this.server_connnection_id = message.connectionId;
        this.startHeartbeat()
        break;
      case "LOBBY_JOINED":
        this.lobbyId = message.lobbyId;
        this.lobbyJoined$.next(message.lobbyId);
        break;
      case "RECEIVE_LOBBY_CHAT":
        this.lobbyChatRecieved$.next({
          sender: message.sender,
          is_from_me: this.isCurrentConnection(message.senderId),
          is_system_message: this.isSystemMessage(message.senderId),
          message: message.content,
          isSystemSuccess: this.isSystemSuccess(message.level),
          isSystemDanger: this.isSystemDanger(message.level),
          isSystemInfo: this.isSystemInfo(message.level)
        });
        break;
      case "GAME_STARTING":
        this.gameStarting$.next(message.gameKey);
        break;
      case "USER_IS_TYPING":
        this.userIsTyping$.next();
        break;
      case "USER_STOPPED_TYPING":
        this.userStoppedTyping$.next();
        break;
      case "LOBBY_HOST":
        this.makeMeTheHost();
        break;
      case "UPDATE_GAME_VOTES" :
        this.updateGameVotes$.next(message.votes as GameVote[]);
        break;
      case "GAME_ACTION_FROM_SERVER":
        this.gameActionReceived$.next(message.gameMessage);
        break;
      case "GAME_OVER" :
        this.gameOver$.next(message.winners);
        break;
      case "PONG":
      default:
        break;
    }
  }

  startHeartbeat() {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => this.sendPing(), environment.socketHeartbeatInterval)
  }

  sendPing() {
    this.socket$.next({ type: "PING", connectionId: this.server_connnection_id });
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
    this.socket$.next({ type: "USER_IS_TYPING", connectionId: this.server_connnection_id, lobbyId: this.lobbyId });
  }

  stopTyping() {
    this.socket$.next({ type: "USER_STOPPED_TYPING", connectionId: this.server_connnection_id, lobbyId: this.lobbyId });
  }

  isSystemDanger(level: string) {
    return level === "DANGER";
  }

  isSystemSuccess(level: string) {
    return level === "SUCCESS";
  }

  isSystemInfo(level: string) {
    return level === "INFO";
  }

  makeMeTheHost() {
    this.isLobbyHost = true;
  }

  voteFor(game: Game) {
    this.socket$.next({type: "VOTE_FOR_GAME", lobbyId: this.lobbyId, gameKey: game.key, connectionId: this.server_connnection_id});
  }

  startGame(game: Game) {
    this.socket$.next({type: "START_GAME", lobbyId: this.lobbyId, gameKey: game.key});
  }

  pressPlay(gameKey: GameKey) {
    this.socket$.next({type: "PLAY", lobbyId: this.lobbyId, gameKey: gameKey});
  }
}

class ChatMessage {
  sender: string;
  is_from_me: boolean;
  is_system_message: boolean;
  message: string;
  isSystemSuccess: boolean;
  isSystemDanger: boolean;
  isSystemInfo: boolean;
}
