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

    this.scrollToBottom();
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

    console.log(this.chatMessage);
    this.gameSocket.sendALobbyChatMessage(this.chatMessage);
    this.chatMessage = "";
  }

  updateChatMessage(message) {
    this.chatMessage = message;
  }

  keyDownFunction(event) {
    if (event.keyCode === 13) {
      this.sendChatMessage();
      return false;
    }
  }

  inTheRightLobby(lobbyId: string): boolean {
    return this.gameSocket.lobbyId === lobbyId;
  }
}
