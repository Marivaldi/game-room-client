import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { HomeComponent } from './home/home.component';
import { JoinLobbyComponent } from './join-lobby/join-lobby.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';


const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent},
  { path: 'lobby/:id', pathMatch: 'full', component: GameScreenComponent},
  { path: 'join', component: JoinLobbyComponent},
  { path: 'join/:id', component: JoinLobbyComponent},
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
