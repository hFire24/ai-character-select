import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterIcon } from './character-icon';

@Component({
  imports: [CharacterIcon],
  template: '<img [appCharacterIcon]="path" [compactIcon]="compact" />'
})
class IconHost {
  path = 'main/example.png';
  compact = false;
}

describe('CharacterIcon', () => {
  let fixture: ComponentFixture<IconHost>;
  let onChange: (event: MediaQueryListEvent) => void;
  let media: MediaQueryList;
  const source = () => fixture.nativeElement.querySelector('img').getAttribute('src');
  const resize = (matches: boolean) => {
    onChange({ matches } as MediaQueryListEvent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    media = {
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener').and.callFake((_: string, listener: typeof onChange) => onChange = listener),
      removeEventListener: jasmine.createSpy('removeEventListener')
    } as unknown as MediaQueryList;
    spyOn(window, 'matchMedia').and.returnValue(media);
    TestBed.configureTestingModule({ imports: [IconHost] });
    fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
  });

  it('switches to square assets on compact mode and restores tall assets when disabled', () => {
    expect(source()).toBe('assets/Icons/tall/example.png');
    fixture.componentInstance.compact = true;
    fixture.detectChanges();
    expect(source()).toBe('assets/Icons/main/example.png');
    fixture.componentInstance.compact = false;
    fixture.detectChanges();
    expect(source()).toBe('assets/Icons/tall/example.png');
  });

  it('reacts to viewport changes in both directions and stays square on mobile', () => {
    resize(true);
    expect(source()).toBe('assets/Icons/main/example.png');
    fixture.componentInstance.compact = true;
    fixture.detectChanges();
    resize(false);
    expect(source()).toBe('assets/Icons/main/example.png');
    fixture.componentInstance.compact = false;
    fixture.detectChanges();
    expect(source()).toBe('assets/Icons/tall/example.png');
    resize(true);
    expect(source()).toBe('assets/Icons/main/example.png');
  });

  it('falls back once and selects the correct asset when the character changes', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(source()).toBe('assets/Icons/main/example.png');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(source()).toBe('assets/Icons/main/example.png');
    fixture.componentInstance.path = 'extended/other.png';
    fixture.detectChanges();
    expect(source()).toBe('assets/Icons/tall-extended/other.png');
    resize(true);
    expect(source()).toBe('assets/Icons/extended/other.png');
  });

  it('removes the shared viewport listener when the application injector is destroyed', () => {
    TestBed.resetTestingModule();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', onChange);
  });
});
