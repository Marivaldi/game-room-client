import { BrowserModule, HammerGestureConfig, HammerModule, HAMMER_GESTURE_CONFIG} from '@angular/platform-browser';
import { Injectable, NgModule } from '@angular/core';

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
import { TriviaGameComponent } from './game-screen/games/trivia-game/trivia-game.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import {HttpClientModule} from '@angular/common/http'

@Injectable()
class HammerConfig extends HammerGestureConfig {
  overrides = <any> {
      'pinch': { enable: false },
      'rotate': { enable: false }
  }
}

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
    GameOverComponent,
    TriviaGameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    HammerModule,
    NgCircleProgressModule.forRoot({
      radius: 60,
      space: -4,
      outerStrokeGradient: false,
      outerStrokeWidth: 4,
      outerStrokeColor: "#4882c2",
      outerStrokeGradientStopColor: "#53a9ff",
      innerStrokeColor: "#e7e8ea",
      innerStrokeWidth: 4,
      titleColor: "#f4f4f4",
      titleFontSize: "1.3em",
      title: "UI",
      animateTitle: false,
      animationDuration: 1000,
      showUnits: false,
      showBackground: false,
      clockwise: false,
      startFromZero: false,
      showSubtitle: false
    })
  ],
  providers: [{
    provide: HAMMER_GESTURE_CONFIG,
    useClass: HammerConfig
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
