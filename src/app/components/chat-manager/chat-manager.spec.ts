import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatManager } from './chat-manager';
import { CharacterService } from '../../services/character.service';
import { of } from 'rxjs';

describe('ChatManager', () => {
  let component: ChatManager;
  let fixture: ComponentFixture<ChatManager>;
  let mockCharacterService: jasmine.SpyObj<CharacterService>;

  beforeEach(async () => {
    localStorage.clear();
    mockCharacterService = jasmine.createSpyObj('CharacterService', ['getCharactersPlusCriticizer', 'getChatGPT']);
    mockCharacterService.getCharactersPlusCriticizer.and.returnValue(of([]));
    mockCharacterService.getChatGPT.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ChatManager],
      providers: [
        { provide: CharacterService, useValue: mockCharacterService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load active chats on init', () => {
    expect(mockCharacterService.getCharactersPlusCriticizer).toHaveBeenCalled();
  });

  it('should toggle select all', () => {
    component.activeChats = [
      { character: {} as any, chatLink: '', timestamp: new Date(), chatCount: 0, weeklyChatCount: 0, selected: false },
      { character: {} as any, chatLink: '', timestamp: new Date(), chatCount: 0, weeklyChatCount: 0, selected: false }
    ];
    
    component.toggleSelectAll();
    expect(component.selectAll).toBe(true);
    expect(component.activeChats.every(chat => chat.selected)).toBe(true);
    
    component.toggleSelectAll();
    expect(component.selectAll).toBe(false);
    expect(component.activeChats.every(chat => !chat.selected)).toBe(true);
  });

  it('should calculate selected count correctly', () => {
    component.activeChats = [
      { character: {} as any, chatLink: '', timestamp: new Date(), chatCount: 0, weeklyChatCount: 0, selected: true },
      { character: {} as any, chatLink: '', timestamp: new Date(), chatCount: 0, weeklyChatCount: 0, selected: false },
      { character: {} as any, chatLink: '', timestamp: new Date(), chatCount: 0, weeklyChatCount: 0, selected: true }
    ];
    
    expect(component.selectedCount).toBe(2);
  });

  it('loads archived chats and restores them without changing the timestamp', () => {
    const character = { id: 42, shortName: 'Test', link: 'default' } as any;
    mockCharacterService.getCharactersPlusCriticizer.and.returnValue(of([character]));
    localStorage.setItem('archivedChatLink_42', 'https://chatgpt.com/c/archived');
    localStorage.setItem('chatLinkTimestamp_42', '2026-01-01T00:00:00.000Z');

    component.loadActiveChats();
    expect(component.archivedChats.length).toBe(1);

    component.restoreArchivedChat(component.archivedChats[0]);

    expect(localStorage.getItem('chatLink_42')).toBe('https://chatgpt.com/c/archived');
    expect(localStorage.getItem('archivedChatLink_42')).toBeNull();
    expect(localStorage.getItem('chatLinkTimestamp_42')).toBe('2026-01-01T00:00:00.000Z');
  });
});
