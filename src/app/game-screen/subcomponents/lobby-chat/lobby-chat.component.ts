import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GameSocketService } from 'src/app/services/game-socket.service';

@Component({
  selector: 'app-lobby-chat',
  templateUrl: './lobby-chat.component.html',
  styleUrls: ['./lobby-chat.component.css']
})
export class LobbyChatComponent implements OnInit, AfterViewChecked, AfterViewInit {
  chatMessage: string;
  messageFeed = [];
  typingTimeout;
  someoneIsTyping: boolean = false;
  alreadySentTypingMessage: boolean = false;
  previousChatScrollHeight;
  @ViewChild('chatWindow') private chatWindow: ElementRef;
  @ViewChild('chatForm') private chatForm: NgForm;

  constructor(private gameSocket: GameSocketService) { }
  ngAfterViewInit(): void {
    this.setPreviousScollHeight();
  }

  ngAfterViewChecked(): void {
    if(!this.chatMessagesHaveBeenAdded()) return;

    this.scrollToBottom();
    this.setPreviousScollHeight();
  }

  ngOnInit(): void {
    this.gameSocket.lobbyChatRecieved$.subscribe((message) => {
      this.messageFeed.push(message);
    });

    this.gameSocket.userIsTyping$.subscribe(() => this.someoneIsTyping = true);
    this.gameSocket.userStoppedTyping$.subscribe(() => this.someoneIsTyping = false);
  }

  scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    } catch (err) { }
  }

  chatMessagesHaveBeenAdded(): boolean {
    return this.previousChatScrollHeight !== this.chatWindow.nativeElement.scrollHeight;
  }

  setPreviousScollHeight() {
    this.previousChatScrollHeight = this.chatWindow.nativeElement.scrollHeight;
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
}