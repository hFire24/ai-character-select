import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, Directive, inject, Injectable, input, NgZone, signal } from '@angular/core';
import { iconAssetPath, useTallIconAssetPath } from '../utils/character-assets';

@Injectable({ providedIn: 'root' })
export class CharacterIconViewport {
  readonly compact = signal(false);

  constructor() {
    const media = inject(DOCUMENT).defaultView?.matchMedia('(max-width: 800px)');
    if (!media) return;
    const zone = inject(NgZone);
    this.compact.set(media.matches);
    const onChange = (event: MediaQueryListEvent) => zone.run(() => this.compact.set(event.matches));
    media.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
  }
}

/** Keeps the image asset in sync with the responsive card layout. */
@Directive({
  selector: 'img[appCharacterIcon]',
  host: {
    '[src]': 'src()',
    '(error)': 'onError()'
  }
})
export class CharacterIcon {
  readonly appCharacterIcon = input.required<string>();
  readonly compactIcon = input(false);
  private readonly viewport = inject(CharacterIconViewport);
  private readonly failedTallPath = signal<string | null>(null);
  readonly src = computed(() => {
    const path = this.appCharacterIcon();
    const tall = useTallIconAssetPath(path);
    return this.compactIcon() || this.viewport.compact() || this.failedTallPath() === tall
      ? iconAssetPath(path) : tall;
  });

  onError() {
    // Only fall back once; a missing square asset must not cause an error loop.
    if (this.src() !== iconAssetPath(this.appCharacterIcon())) {
      this.failedTallPath.set(this.src());
    }
  }
}
