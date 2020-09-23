import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.css']
})
export class GameOverComponent implements OnInit {
  @Input() winners: string[];
  @Output() closeMe = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }

}
