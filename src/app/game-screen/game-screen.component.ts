import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameSocketService } from '../services/game-socket.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit {
  lobby_id: string;
  constructor(private route: ActivatedRoute, private gameSocket: GameSocketService) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.lobby_id = params['id'];
   });

   this.gameSocket.lobbyChatRecieved$.subscribe((message) => console.log(message));
  }

  sendRandomMessage() {
    this.gameSocket.sendALobbyChatMessage("Hello, World");
  }

}
