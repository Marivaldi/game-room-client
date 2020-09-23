import { Component, OnInit } from '@angular/core';
import { GameKey } from 'src/app/models/enums/game-key';
import { Game } from 'src/app/models/game';
import { GameVote } from 'src/app/models/game-vote';
import { GameSocketService } from 'src/app/services/game-socket.service';

@Component({
  selector: 'app-games-list',
  templateUrl: './games-list.component.html',
  styleUrls: ['./games-list.component.css']
})
export class GamesListComponent implements OnInit {
  games: Map<GameKey, Game> = new Map<GameKey, Game>();

  get isLobbyHost(): boolean {
    return this.gameSocket.isLobbyHost;
  }

  constructor(private gameSocket: GameSocketService) { }

  ngOnInit(): void {
    this.games.set(GameKey.TEST_GAME, {title: "Test Game", key: GameKey.TEST_GAME, subtitle: "2-5 Players", votes: 0, description: "A test of the games system. Whoever clicks the button the fastest wins."});
    this.gameSocket.updateGameVotes$.subscribe((votes: GameVote[]) => this.setGameVotes(votes))
  }

  voteFor(game: Game) {
    this.gameSocket.voteFor(game);
  }

  setGameVotes(votes: GameVote[]) {
    if(!votes || votes.length === 0) return;

    for(let i = 0; i < votes.length; i++) {
      const key = votes[i].key;
      const amountOfVotes = votes[i].votes;
      if(!this.games.has(key)) continue;

      this.games.get(key).votes = amountOfVotes;
    }
  }

}
