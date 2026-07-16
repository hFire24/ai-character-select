import { Component, OnInit } from '@angular/core';
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

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.loadActiveChats();
  }

  loadActiveChats() {
    this.characterService.getCharactersPlusCriticizer().subscribe((characters: Character[]) => {
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

          if (archivedChatLink) {
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

  restoreArchivedChat(chat: ArchivedChat) {
    if (restoreChatLink(chat.character)) {
      this.loadActiveChats();
    }
  }

  openChatLink(chat: ActiveChat) {
    window.open(chat.chatLink, '_blank');
  }
}
