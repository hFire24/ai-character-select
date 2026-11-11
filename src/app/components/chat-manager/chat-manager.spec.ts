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
    mockCharacterService = jasmine.createSpyObj('CharacterService', ['getCharacters', 'getChatGPT']);
    mockCharacterService.getCharacters.and.returnValue(of([]));
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

  afterEach(() => localStorage.clear());

  it('exports chat data in the existing backup format without unrelated settings', async () => {
    localStorage.setItem('chatLink_42', 'https://chatgpt.com/c/current');
    localStorage.setItem('archivedChatLink_42', 'https://chatgpt.com/c/previous');
    localStorage.setItem('chatLinkCounter_42', '3');
    localStorage.setItem('theme', 'dark');
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');

    component.exportData();

    const blob = createUrl.calls.mostRecent().args[0] as Blob;
    const backup = JSON.parse(await blob.text());
    expect(backup.version).toBe(1);
    expect(backup.localStorage).toEqual({
      chatLink_42: 'https://chatgpt.com/c/current',
      archivedChatLink_42: 'https://chatgpt.com/c/previous',
      chatLinkCounter_42: '3'
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('imports existing backups and refreshes active and archived chats', (done) => {
    const active = { id: 42, shortName: 'Active' } as any;
    const archived = { id: 43, shortName: 'Archived' } as any;
    mockCharacterService.getCharacters.and.callFake(() => of([active, archived]));
    localStorage.setItem('chatLink_99', 'https://chatgpt.com/c/stale');
    localStorage.setItem('theme', 'dark');
    component.selectAll = true;
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [new File([JSON.stringify({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      localStorage: {
        chatLink_42: 'https://chatgpt.com/c/current',
        archivedChatLink_43: 'https://chatgpt.com/c/archived',
        chatLinkTimestamp_42: '2026-01-01T00:00:00.000Z',
        chatLinkHistory_42: '["2026-01-01T00:00:00.000Z"]',
        chatLinkCounter_42: '1'
      }
    })], 'backup.json')] });
    spyOn(window, 'alert').and.callFake(() => {
      expect(component.activeChats.map(chat => chat.character.id)).toEqual([42]);
      expect(component.archivedChats.map(chat => chat.character.id)).toEqual([43]);
      expect(component.selectAll).toBeFalse();
      expect(localStorage.getItem('chatLink_99')).toBeNull();
      expect(localStorage.getItem('chatLinkCounter_42')).toBe('1');
      expect(localStorage.getItem('theme')).toBe('dark');
      done();
    });

    component.importData({ target: input } as unknown as Event);
  });

  it('rejects backups containing unrelated settings without replacing chat data', (done) => {
    localStorage.setItem('chatLink_42', 'https://chatgpt.com/c/keep');
    const refresh = spyOn(component, 'loadActiveChats');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [new File([JSON.stringify({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      localStorage: { theme: 'light' }
    })], 'invalid.json')] });
    spyOn(window, 'alert').and.callFake(() => {
      expect(localStorage.getItem('chatLink_42')).toBe('https://chatgpt.com/c/keep');
      expect(refresh).not.toHaveBeenCalled();
      done();
    });

    component.importData({ target: input } as unknown as Event);
  });

  it('should load active chats on init', () => {
    expect(mockCharacterService.getCharacters).toHaveBeenCalled();
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
    mockCharacterService.getCharacters.and.returnValue(of([character]));
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
