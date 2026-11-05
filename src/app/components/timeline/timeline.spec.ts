import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Timeline } from './timeline';
import { Character, CharacterService } from '../../services/character.service';

describe('Linked timelines', () => {
  const characters = [
    { id: 1, shortName: 'First', creationDate: '2023-01-01', generation: 1 },
    { id: 2, shortName: 'Second', creationDate: '2023-01-01', generation: 1 },
    { id: 3, shortName: 'Third', creationDate: '2025-06-01', generation: 5 },
    { id: 4, shortName: 'Fourth', creationDate: '2026-06-01', generation: 6 }
  ] as Character[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Timeline],
      providers: [{ provide: CharacterService, useValue: { getCharactersSplitTwins: () => of(characters) } }]
    });
  });

  it('keeps the overview highlight while a closed node is hovered', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    fixture.componentInstance.toggleGeneration('5-6');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const node = root.querySelector('.timeline-node:not(.generation-button)') as HTMLButtonElement;
    node.dispatchEvent(new MouseEvent('mouseenter'));
    node.click();
    fixture.detectChanges();
    expect(root.querySelector('.overview-highlight')).toBeTruthy();
    node.click();
    fixture.detectChanges();
    expect(root.querySelector('.overview-highlight')).toBeTruthy();
    node.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(root.querySelector('.overview-highlight')).toBeNull();
    node.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(root.querySelector('.overview-highlight')).toBeTruthy();
  });

  it('spaces the overview proportionally to elapsed days across all years', () => {
    TestBed.inject(CharacterService).getCharactersSplitTwins = () => of([
      { id: 1, shortName: 'A', creationDate: '2023-01-01', generation: 1 },
      { id: 2, shortName: 'B', creationDate: '2023-01-11', generation: 1 },
      { id: 3, shortName: 'C', creationDate: '2023-02-10', generation: 1 },
      { id: 4, shortName: 'D', creationDate: '2025-01-01', generation: 5 }
    ] as Character[]);
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const nodes = fixture.componentInstance.nodes;
    const tenDays = nodes[1].overviewPosition - nodes[0].overviewPosition;
    const thirtyDays = nodes[2].overviewPosition - nodes[1].overviewPosition;
    expect(thirtyDays / tenDays).toBeCloseTo(3);
    expect(nodes[3].overviewPosition).toBeCloseTo(100);
  });

  it('searches names and expands and highlights the selected character’s grouped creation day', () => {
    TestBed.inject(CharacterService).getCharactersSplitTwins = () => of([
      { id: 3, name: 'Third Character', shortName: 'Third', creationDate: '2025-06-01', generation: 5 },
      { id: 4, name: 'Fourth Character', shortName: 'Fourth', creationDate: '2026-06-01', generation: 6 },
      { id: 5, name: 'Undated Character', shortName: 'Undated', generation: 7 }
    ] as Character[]);
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('#timeline-character-search') as HTMLInputElement;
    input.value = 'fourth char';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelectorAll('.search-results button').length).toBe(1);
    (root.querySelector('.search-results button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.collapsedGenerations.has('5-6')).toBeFalse();
    expect(component.activeNodeKey).toBe('2026-06-01');
    expect(root.querySelector('.node-tooltip .tooltip-character')?.textContent).toContain('Fourth');
    expect(root.querySelector('.overview-highlight')?.textContent).toContain('Fourth');
    expect((root.querySelector('#timeline-character-search') as HTMLInputElement).value).toBe('');
    component.updateSearch('third');
    expect(component.searchResults.map(character => character.id)).toEqual([3]);
    component.updateSearch('undated');
    expect(component.searchResults.length).toBe(0);
  });

  it('scrolls with the edge arrows on hover and click, and stops on pointer leave', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const scroll = root.querySelector('.timeline-viewport .timeline-scroll') as HTMLElement;
    let scrollPosition = 100;
    Object.defineProperty(scroll, 'scrollLeft', {
      configurable: true,
      get: () => scrollPosition,
      set: (value: number) => { scrollPosition = value; }
    });
    Object.defineProperty(scroll, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(scroll, 'scrollWidth', { configurable: true, value: 400 });
    fixture.componentInstance.updateScrollOverflow();
    fixture.detectChanges();
    let frame: FrameRequestCallback | undefined;
    spyOn(window, 'requestAnimationFrame').and.callFake(callback => { frame = callback; return 42; });
    const cancel = spyOn(window, 'cancelAnimationFrame');
    const left = root.querySelector('.scroll-arrow-left') as HTMLButtonElement;
    const right = root.querySelector('.scroll-arrow-right') as HTMLButtonElement;
    left.dispatchEvent(new MouseEvent('mouseenter'));
    frame!(0);
    expect(scrollPosition).toBe(97);
    left.dispatchEvent(new MouseEvent('mouseleave'));
    expect(cancel).toHaveBeenCalledWith(42);
    right.dispatchEvent(new MouseEvent('mouseenter'));
    frame!(0);
    expect(scrollPosition).toBe(100);
    right.dispatchEvent(new MouseEvent('mouseleave'));
    right.click();
    expect(scrollPosition).toBe(240);
    expect(Number(getComputedStyle(right).zIndex)).toBeGreaterThan(6);
    fixture.destroy();
  });

  it('shows arrows only while the timeline overflows', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const scroll = root.querySelector('.timeline-viewport .timeline-scroll') as HTMLElement;
    let contentWidth = 200;
    Object.defineProperty(scroll, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(scroll, 'scrollWidth', { configurable: true, get: () => contentWidth });
    fixture.componentInstance.updateScrollOverflow();
    fixture.detectChanges();
    expect(root.querySelectorAll('.scroll-arrow').length).toBe(0);
    contentWidth = 400;
    fixture.componentInstance.updateScrollOverflow();
    fixture.detectChanges();
    expect(root.querySelectorAll('.scroll-arrow').length).toBe(2);
    contentWidth = 200;
    fixture.componentInstance.updateScrollOverflow();
    fixture.detectChanges();
    expect(root.querySelectorAll('.scroll-arrow').length).toBe(0);
  });

  it('offers collapse all only when multiple generations are open', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.timeline-actions button')).toBeNull();
    component.toggleGeneration('1');
    fixture.detectChanges();
    expect(root.querySelector('.timeline-actions button')).toBeNull();
    component.toggleGeneration('5-6');
    fixture.detectChanges();
    const button = root.querySelector('.timeline-actions button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Collapse all');
    button.click();
    fixture.detectChanges();
    expect(component.expandedGenerationControls.length).toBe(0);
    expect(component.equalNodes.every(node => node.collapsed)).toBeTrue();
    expect(root.querySelector('.timeline-actions button')).toBeNull();
  });

  it('clears a removed collapse control so another generation and its nodes can highlight', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.toggleGeneration('1');
    fixture.detectChanges();
    const collapse = fixture.nativeElement.querySelector('.below-collapse') as HTMLButtonElement;
    collapse.dispatchEvent(new MouseEvent('mouseenter'));
    collapse.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(component.highlightedGeneration?.key).toBe('1');
    collapse.click();
    fixture.detectChanges();
    expect(component.hoveredGenerationKey).toBeNull();
    expect(component.focusedGenerationKey).toBeNull();
    const other = fixture.nativeElement.querySelectorAll('.generation-button')[1] as HTMLButtonElement;
    other.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(component.highlightedGeneration?.key).toBe('5-6');
    expect(fixture.nativeElement.querySelectorAll('.overview-range').length).toBe(2);
    other.click();
    fixture.detectChanges();
    const day = fixture.nativeElement.querySelector('.timeline-node:not(.generation-button)') as HTMLButtonElement;
    day.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(component.highlightedGeneration).toBeNull();
    expect(component.highlightedNode?.characters[0].id).toBe(3);
    expect(fixture.nativeElement.querySelector('.overview-highlight')).toBeTruthy();
  });

  it('groups Gens 13–14 and counts creation-day nodes rather than characters', () => {
    TestBed.inject(CharacterService).getCharactersSplitTwins = () => of([
      { id: 20, shortName: 'A', creationDate: '2026-01-01', generation: 13 },
      { id: 21, shortName: 'B', creationDate: '2026-01-01', generation: 13 },
      { id: 22, shortName: 'C', creationDate: '2026-02-01', generation: 14 }
    ] as Character[]);
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.generationGroups[0].nodeCount).toBe(2);
    expect(component.generationGroups[0].count).toBe(3);
    expect(component.generationGroups[0].colorClasses).toEqual(['gen13', 'gen14']);
    expect(fixture.nativeElement.querySelector('.generation-button .collapsed-label').textContent).toBe('Gens 13–14');
    expect(fixture.nativeElement.querySelector('.generation-button .generation-count').textContent).toBe('2/3');
    component.toggleGeneration('13-14');
    fixture.detectChanges();
    expect(component.equalNodes.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.below-collapse .generation-count')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('(2 nodes)');
  });

  it('gives every creation day an equal slot and shows counts for shared days', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.generationGroups.forEach(group => component.toggleGeneration(group.key));
    fixture.detectChanges();
    expect(component.equalNodes.length).toBe(3);
    expect(component.equalNodes[0].characters.map(character => character.id)).toEqual([1, 2]);
    expect(fixture.nativeElement.querySelector('.node-count').textContent.trim()).toBe('2');
    const firstNode = fixture.nativeElement.querySelectorAll('.timeline-node')[0] as HTMLButtonElement;
    firstNode.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.node-tooltip .tooltip-character').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.timeline-detail .node-tooltip')).toBeNull();
    const gaps = component.equalNodes.slice(1).map((node, index) => node.position - component.equalNodes[index].position);
    expect(gaps[0]).toBe(24);
    expect(gaps[1]).toBe(24);
    expect(component.equalNodes[0].overviewPosition).toBe(0);
    expect(component.equalNodes[2].overviewPosition).toBe(100);
    expect(fixture.nativeElement.querySelectorAll('.timeline-overview .timeline-node').length).toBe(0);
  });

  it('links hover and keyboard focus to the overview and preserves its scale through collapse', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.generationGroups.forEach(group => component.toggleGeneration(group.key));
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelectorAll('.timeline-node')[1] as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(component.highlightedNode?.characters[0].id).toBe(3);
    expect(fixture.nativeElement.querySelector('.overview-highlight').textContent).toContain('Third');
    button.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.overview-highlight')).toBeNull();
    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(component.highlightedNode?.characters[0].id).toBe(3);
    const positions = component.equalNodes.map(node => node.overviewPosition);
    component.toggleGeneration('1');
    component.toggleGeneration('1');
    component.equalNodes.forEach((node, index) => expect(node.overviewPosition).toBeCloseTo(positions[index]));
  });

  it('collapses Gens 2–4 together while retaining their colors, then restores the days', () => {
    TestBed.inject(CharacterService).getCharactersSplitTwins = () => of([
      ...characters,
      { id: 10, shortName: 'Gen two', creationDate: '2024-10-02', generation: 2 },
      { id: 11, shortName: 'Gen three', creationDate: '2024-11-02', generation: 3 },
      { id: 12, shortName: 'Gen four', creationDate: '2025-01-02', generation: 4 }
    ] as Character[]);
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const originalCount = component.equalNodes.length;
    expect(component.equalNodes.every(node => node.collapsed)).toBeTrue();
    const collapsed = component.equalNodes.find(node => node.generationLabel === 'Gens 2–4')!;
    expect(collapsed.characters.map(character => character.id)).toEqual([10, 11, 12]);
    expect(collapsed.colorClasses).toEqual(['gen2', 'gen3', 'gen4']);
    expect(fixture.nativeElement.querySelector('input[type="range"]')).toBeNull();
    component.toggleNode(collapsed, new MouseEvent('click'));
    fixture.detectChanges();
    expect(component.equalNodes.length).toBe(originalCount + 2);
    expect(component.equalNodes.filter(node => ['gen2', 'gen3', 'gen4'].includes(node.generationClass)).length).toBe(3);
  });

  it('opens Gens 5–6 from their timeline button and retains their date range and colors', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.collapsedGenerations.has('5-6')).toBeTrue();
    const group = component.generationGroups.find(group => group.key === '5-6')!;
    expect(group.colorClasses).toEqual(['gen5', 'gen6']);
    expect(group.dateRange).toContain('2025');
    expect(group.dateRange).toContain('2026');
    const button = [...fixture.nativeElement.querySelectorAll('.generation-button')]
      .find((button: any) => button.textContent.includes('Gens 5–6')) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(component.equalNodes.filter(node => node.generation === 5 || node.generation === 6).map(node => node.generationClass)).toEqual(['gen5', 'gen6']);
    const collapse = fixture.nativeElement.querySelector('.below-collapse') as HTMLButtonElement;
    collapse.click();
    fixture.detectChanges();
    expect(component.equalNodes.find(node => node.generationLabel === 'Gens 5–6')?.collapsed).toBeTrue();
  });

  it('shows generation buttons without character previews and highlights all combined ranges', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.generation-button .collapsed-label')?.textContent?.trim()).toBe('Gen 1');
    expect(root.querySelectorAll('.tooltip-character').length).toBe(0);
    expect(root.querySelectorAll('.overview-character').length).toBe(characters.length);
    root.querySelectorAll('.overview-character').forEach(marker => {
      expect(marker.tagName).toBe('SPAN');
      expect(marker.hasAttribute('tabindex')).toBeFalse();
    });
    const combined = root.querySelectorAll('.generation-button')[1] as HTMLButtonElement;
    combined.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(root.querySelectorAll('.overview-range').length).toBe(2);
    expect(root.querySelector('.overview-range-description')?.textContent).toContain('Gen 5');
    expect(root.querySelector('.overview-range-description')?.textContent).toContain('Gen 6');
    expect(root.querySelector('.overview-highlight')).toBeNull();
    expect(root.querySelectorAll('.tooltip-character').length).toBe(0);
    combined.dispatchEvent(new MouseEvent('mouseleave'));
    combined.click();
    fixture.detectChanges();
    const collapse = [...root.querySelectorAll('.below-collapse')]
      .find(button => button.getAttribute('aria-label') === 'Collapse Gens 5–6') as HTMLButtonElement;
    expect(collapse).toBeTruthy();
    collapse.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.tooltip-character').length).toBe(0);
  });

  it('keeps generation controls only inside Timeline 2', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.timeline-overview button').length).toBe(0);
    expect(root.querySelector('.generation-controls')).toBeNull();
    expect(root.querySelectorAll('.timeline-canvas .generation-button').length).toBe(2);
    const nodes = fixture.componentInstance.equalNodes;
    expect(nodes[1].position - nodes[1].layoutWidth! / 2
      - (nodes[0].position + nodes[0].layoutWidth! / 2)).toBe(12);
    (root.querySelector('.generation-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.timeline-canvas .below-collapse')).toBeTruthy();
  });

  it('colors generation buttons, keeps overview markers tiny, and collapses from below the nodes', () => {
    const fixture = TestBed.createComponent(Timeline);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector('.generation-button') as HTMLButtonElement;
    expect(getComputedStyle(button).backgroundImage).toContain('217, 79, 112');
    const marker = root.querySelector('.overview-character') as HTMLElement;
    const markerStyle = getComputedStyle(marker);
    expect(markerStyle.width).toBe('4px');
    expect(markerStyle.height).toBe('6px');
    expect(markerStyle.borderTopWidth).toBe('0px');
    expect(markerStyle.boxShadow).toBe('none');
    button.click();
    fixture.detectChanges();
    const collapse = root.querySelector('.below-collapse') as HTMLButtonElement;
    expect(collapse.textContent?.trim()).toBe('Collapse');
    expect(collapse.getAttribute('aria-label')).toBe('Collapse Gen 1');
    expect(parseFloat(getComputedStyle(collapse).top)).toBeGreaterThan(fixture.componentInstance.axisY);
    collapse.click();
    fixture.detectChanges();
    expect(root.querySelector('.below-collapse')).toBeNull();
    expect(fixture.componentInstance.collapsedGenerations.has('1')).toBeTrue();
  });
});
