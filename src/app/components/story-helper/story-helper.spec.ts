import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryHelper } from './story-helper';

describe('StoryHelper', () => {
  let component: StoryHelper;
  let fixture: ComponentFixture<StoryHelper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryHelper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryHelper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
