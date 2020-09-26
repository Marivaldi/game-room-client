import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaserGameComponent } from './phaser-game.component';

describe('PhaserGameComponent', () => {
  let component: PhaserGameComponent;
  let fixture: ComponentFixture<PhaserGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhaserGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaserGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
