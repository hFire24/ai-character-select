import { Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';

// SVG images do not support native loading="lazy".
@Directive({ selector: 'image[lazyIconSrc]', standalone: true })
export class LazySvgIcon implements OnDestroy {
  private readonly element = inject(ElementRef<SVGImageElement>).nativeElement;
  private observer?: IntersectionObserver;

  @Input() set lazyIconSrc(src: string) {
    this.observer?.disconnect();
    this.element.removeAttribute('href');
    if (!src) return;
    if (typeof IntersectionObserver === 'undefined') {
      this.element.setAttribute('href', src);
      return;
    }
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        this.element.setAttribute('href', src);
        this.observer?.disconnect();
      }
    }, { rootMargin: '200px' });
    this.observer.observe(this.element);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
