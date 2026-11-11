import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';
import {
  archiveChatLink,
  getArchivedChatLink,
  getStoredChatLink,
  restoreChatLink
} from '../../utils/chat-link-storage';

interface ActiveChat {
  character: Character;
  chatLink: string;
  timestamp: Date;
  chatCount: number;
  weeklyChatCount: number;
  selected: boolean;
}

interface ArchivedChat {
  character: Character;
  chatLink: string;
  timestamp: Date | null;
  chatCount: number;
  weeklyChatCount: number;
}

@Component({
  selector: 'app-chat-manager',
  standalone: true,
  imports: [CommonModule, RelativeDatePipe],
  templateUrl: './chat-manager.html',
  styleUrl: './chat-manager.scss'
})
export class ChatManager implements OnInit {
  activeChats: ActiveChat[] = [];
  archivedChats: ArchivedChat[] = [];
  selectAll = false;
  @ViewChild('timestampDialog') timestampDialog?: ElementRef<HTMLDialogElement>;
  timestampCharacter: Character | null = null;
  timestampInput = '';
  private timestampPrecision: { seconds: number; milliseconds: number } | null = null;

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.loadActiveChats();
  }

  loadActiveChats() {
    this.characterService.getCharacters().subscribe((characters: Character[]) => {
      // Add ChatGPT
      this.characterService.getChatGPT().subscribe(chatGPTCharacter => {
        if (Array.isArray(chatGPTCharacter)) {
          characters.push(...chatGPTCharacter);
        } else {
          characters.push(chatGPTCharacter);
        }

        const activeChats: ActiveChat[] = [];
        const archivedChats: ArchivedChat[] = [];

        characters.forEach(character => {
          const chatLink = getStoredChatLink(character);
          const archivedChatLink = getArchivedChatLink(character);

          const timestampKey = 'chatLinkTimestamp_' + (character.id ?? 'unknown');
          const timestampValue = localStorage.getItem(timestampKey);
          const timestamp = timestampValue ? new Date(timestampValue) : null;

          const counterKey = 'chatLinkCounter_' + (character.id ?? 'unknown');
          const counter = localStorage.getItem(counterKey);
          const chatCount = counter ? parseInt(counter, 10) : 0;

          const historyKey = 'chatLinkHistory_' + (character.id ?? 'unknown');
          const historyStr = localStorage.getItem(historyKey);
          let weeklyChatCount = 0;

          if (historyStr) {
            try {
              const history: string[] = JSON.parse(historyStr);
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

              weeklyChatCount = history.filter(ts => new Date(ts) >= sevenDaysAgo).length;
            } catch (e) {
              console.error('Error parsing chat history:', e);
            }
          }
          
          // Only include characters with active chat links
          if (chatLink) {
            activeChats.push({
              character: character,
              chatLink: chatLink,
              timestamp: timestamp ?? new Date(),
              chatCount: chatCount,
              weeklyChatCount: weeklyChatCount,
              selected: false
            });
          }

          else if (archivedChatLink) {
            archivedChats.push({
              character,
              chatLink: archivedChatLink,
              timestamp,
              chatCount,
              weeklyChatCount
            });
          }
        });

        // Sort by most recent first
        this.activeChats = activeChats.sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
        this.archivedChats = archivedChats.sort((a, b) =>
          (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
        );
      });
    });
  }

  editChatLink(character: Character): void {
    const value = prompt('Paste the new chat link:', getStoredChatLink(character) || '');
    if (value !== null) this.correctChatLink(character, value);
  }

  editLastTimestamp(character: Character): void {
    const current = localStorage.getItem('chatLinkTimestamp_' + character.id);
    const date = current ? new Date(current) : new Date();
    this.timestampPrecision = Number.isNaN(date.getTime()) ? null : {
      seconds: date.getSeconds(),
      milliseconds: date.getMilliseconds()
    };
    const pad = (value: number) => String(value).padStart(2, '0');
    this.timestampInput = Number.isNaN(date.getTime()) ? '' :
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    this.timestampCharacter = character;
    this.timestampDialog?.nativeElement.showModal();
  }

  saveLastTimestamp(value: string): void {
    if (!this.timestampCharacter || !value || Number.isNaN(new Date(value).getTime())) return;
    const date = new Date(value);
    if (this.timestampPrecision) {
      date.setSeconds(this.timestampPrecision.seconds, this.timestampPrecision.milliseconds);
    }
    this.correctChatTimestamp(this.timestampCharacter, date.toISOString());
    this.cancelTimestampEdit();
  }

  onTimestampDialogClick(event: MouseEvent): void {
    const dialog = this.timestampDialog?.nativeElement;
    if (!dialog || event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      this.cancelTimestampEdit();
    }
  }

  cancelTimestampEdit(): void {
    this.timestampCharacter = null;
    this.timestampInput = '';
    this.timestampPrecision = null;
    this.timestampDialog?.nativeElement.close();
  }

  correctChatLink(character: Character, value: string): void {
    const link = value.trim();
    if (!this.isValidChatLink(link)) {
      alert('Please enter a valid ChatGPT chat URL.');
      return;
    }
    localStorage.setItem('chatLink_' + character.id, link);
    this.loadActiveChats();
  }

  correctChatTimestamp(character: Character, value: string): void {
    const normalized = value.trim().replace(' ', 'T');
    const date = new Date(normalized);
    if (!value || Number.isNaN(date.getTime())) {
      alert('Please enter a valid date and time.');
      return;
    }
    const timestamp = date.toISOString();
    const history = this.getChatLinkHistory(character);
    if (history.length) {
      history[history.length - 1] = timestamp;
      localStorage.setItem('chatLinkHistory_' + character.id, JSON.stringify(history));
    }
    localStorage.setItem('chatLinkTimestamp_' + character.id, timestamp);
    this.loadActiveChats();
  }

  canUndoLatestChat(character: Character): boolean {
    return getArchivedChatLink(character) !== null && getStoredChatLink(character) !== null && this.getChatLinkHistory(character).length > 0;
  }

  undoLatestChat(character: Character): void {
    if (!this.canUndoLatestChat(character)) return;
    if (!confirm('Remove the latest chat for ' + character.shortName + '? This action cannot be undone.')) return;
    const history = this.getChatLinkHistory(character);
    history.pop();
    localStorage.setItem('chatLinkHistory_' + character.id, JSON.stringify(history));
    const count = Number(localStorage.getItem('chatLinkCounter_' + character.id) || 0);
    localStorage.setItem('chatLinkCounter_' + character.id, String(Math.max(0, Number.isFinite(count) ? count - 1 : 0)));
    localStorage.removeItem('chatLink_' + character.id);
    const previousTimestamp = history[history.length - 1];
    if (previousTimestamp) localStorage.setItem('chatLinkTimestamp_' + character.id, previousTimestamp);
    else localStorage.removeItem('chatLinkTimestamp_' + character.id);
    this.loadActiveChats();
  }
  
  isValidChatLink(newLink: string): boolean {
    const chatGPTPattern = /^https:\/\/chatgpt\.com\/(g\/[a-zA-Z0-9\-]+\/)?c\/[a-f0-9\-]+(?:\?.*)?$/;
    return chatGPTPattern.test(newLink.trim());
  }

  private getChatLinkHistory(character: Character): string[] {
    try {
      const history: unknown = JSON.parse(localStorage.getItem('chatLinkHistory_' + character.id) || '[]');
      return Array.isArray(history) ? history.filter((value): value is string => typeof value === 'string') : [];
    } catch { return []; }
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.activeChats.forEach(chat => chat.selected = this.selectAll);
  }

  toggleSelection(chat: ActiveChat) {
    chat.selected = !chat.selected;
    this.updateSelectAllState();
  }

  updateSelectAllState() {
    this.selectAll = this.activeChats.length > 0 && this.activeChats.every(chat => chat.selected);
  }

  get selectedCount(): number {
    return this.activeChats.filter(chat => chat.selected).length;
  }

  deleteSelected() {
    if (this.selectedCount === 0) {
      alert('No chats selected.');
      return;
    }

    const confirmed = confirm(`Are you sure you want to archive ${this.selectedCount} selected chat${this.selectedCount === 1 ? '' : 's'}?`);
    if (confirmed) {
      this.activeChats.forEach(chat => {
        if (chat.selected) {
          archiveChatLink(chat.character);
          // Keep timestamp and counter for historical tracking
          // localStorage.removeItem(timestampKey);
          // localStorage.removeItem(counterKey);
          // localStorage.removeItem(historyKey);
        }
      });
      
      alert(`${this.selectedCount} chat${this.selectedCount === 1 ? '' : 's'} archived successfully.`);
      this.loadActiveChats();
      this.selectAll = false;
    }
  }

  archiveChat(character: Character): void {
    if (!confirm('Archive the chat for ' + character.shortName + '? You can restore it later, but the previous archived chat will be lost.')) return;
    if (archiveChatLink(character)) {
      this.loadActiveChats();
      this.selectAll = false;
    }
  }

  restoreArchivedChat(chat: ArchivedChat) {
    if (restoreChatLink(chat.character)) {
      this.loadActiveChats();
    }
  }

  openChatLink(chat: ActiveChat) {
    window.open(chat.chatLink, '_blank');
  }
}
