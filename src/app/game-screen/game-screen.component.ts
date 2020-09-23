import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit, AfterViewChecked {
  chatMessage: string;
  lobby_id: string;
  messageFeed = [];
  timerInterval;
  waitingInterval;
  typingTimeout;
  showCountdown: boolean = false;
  timeUntilGameStart: number = 10;
  waitingElipses: string = "";
  someoneIsTyping: boolean = false;
  alreadySentTypingMessage: boolean = false;
  @ViewChild('chatWindow') private chatWindow: ElementRef;
  @ViewChild('chatForm') private chatForm: NgForm;

  constructor(private router: Router, private route: ActivatedRoute, private gameSocket: GameSocketService) { }

  ngOnInit(): void {

    this.route.params.subscribe(params => {
      this.lobby_id = params['id'];
      const inTheRightLobby = this.inTheRightLobby(this.lobby_id);
      if(!inTheRightLobby) this.router.navigate(['/']);
    });

    this.gameSocket.lobbyChatRecieved$.subscribe((message) => {
      this.messageFeed.push(message);
    });

    this.gameSocket.gameStart$.subscribe(() => this.startTimer());

    this.scrollToBottom();
    this.startWaiting();
    this.gameSocket.userIsTyping$.subscribe(() => this.someoneIsTyping = true);
    this.gameSocket.userStoppedTyping$.subscribe(() => this.someoneIsTyping = false);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    } catch (err) { }
  }

  sendChatMessage() {
    if (this.chatForm.invalid) return;


    clearTimeout(this.typingTimeout);
    this.gameSocket.stopTyping();
    this.alreadySentTypingMessage = false;
    this.gameSocket.sendALobbyChatMessage(this.chatMessage);
    this.chatMessage = "";
  }

  updateChatMessage(message) {
    this.chatMessage = message;
  }

  keyDownFunction(event) {
    if (event.keyCode === 13) {
      this.sendChatMessage();
      event.stopPropagation();
      return false;
    }

    if(this.alreadySentTypingMessage) return;

    this.startedTyping();
    this.alreadySentTypingMessage = true;
  }

  startedTyping() {
    clearTimeout(this.typingTimeout);
    this.gameSocket.startTyping();
  }

  keyUpFunction(event) {
    if (event.keyCode === 13) {
      event.stopPropagation();
      return false;
    }

    this.stoppedTyping();
  }

  stoppedTyping() {
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.gameSocket.stopTyping();
      this.alreadySentTypingMessage = false;
    }, 1000);
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
