import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoodModal } from './mood-modal';

describe('MoodModal', () => {
  let component: MoodModal;
  let fixture: ComponentFixture<MoodModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoodModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoodModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
