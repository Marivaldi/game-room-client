import { Component, OnInit } from '@angular/core';
import { GameKey } from 'src/app/models/enums/game-key';
import { Game } from 'src/app/models/game';

@Component({
  selector: 'app-games-list',
  templateUrl: './games-list.component.html',
  styleUrls: ['./games-list.component.css']
})
export class GamesListComponent implements OnInit {
  games: Game[] = [];
  constructor() { }

  ngOnInit(): void {
    this.games.push({title: "Test Game", key: GameKey.TEST_GAME, subtitle: "This is just a test", votes: 4, description: "A test of the games system. Whoever clicks the button the fastest wins."})
  }

}
