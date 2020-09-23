import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreStartComponent } from './pre-start.component';

describe('PreStartComponent', () => {
  let component: PreStartComponent;
  let fixture: ComponentFixture<PreStartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreStartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
