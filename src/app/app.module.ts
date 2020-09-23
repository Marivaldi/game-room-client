import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { HomeComponent } from './home/home.component';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { FormsModule } from '@angular/forms';
import { GamesListComponent } from './game-screen/subcomponents/games-list/games-list.component';
import { LobbyChatComponent } from './game-screen/subcomponents/lobby-chat/lobby-chat.component';
import { PreStartComponent } from './game-screen/subcomponents/pre-start/pre-start.component';
import { TestGameComponent } from './game-screen/games/test-game/test-game.component';
import { GameOverComponent } from './game-screen/subcomponents/game-over/game-over.component';

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    HomeComponent,
    GameScreenComponent,
    GamesListComponent,
    LobbyChatComponent,
    PreStartComponent,
    TestGameComponent,
    GameOverComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
