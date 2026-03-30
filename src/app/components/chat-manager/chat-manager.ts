import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

interface ActiveChat {
  character: Character;
  chatLink: string;
  timestamp: Date;
  chatCount: number;
  weeklyChatCount: number;
  selected: boolean;
}

@Component({
  selector: 'app-chat-manager',
  standalone: true,
  imports: [CommonModule, BackButton, RelativeDatePipe],
  templateUrl: './chat-manager.html',
  styleUrl: './chat-manager.scss'
})
export class ChatManager implements OnInit {
  activeChats: ActiveChat[] = [];
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

        characters.forEach(character => {
          const chatLinkKey = 'chatLink_' + (character.id ?? 'unknown');
          const chatLink = localStorage.getItem(chatLinkKey);
          
          // Only include characters with active chat links
          if (chatLink) {
            const timestampKey = 'chatLinkTimestamp_' + (character.id ?? 'unknown');
            const timestamp = localStorage.getItem(timestampKey);
            
            const counterKey = 'chatLinkCounter_' + (character.id ?? 'unknown');
            const counter = localStorage.getItem(counterKey);
            const chatCount = counter ? parseInt(counter, 10) : 0;
            
            // Get weekly chat count
            const historyKey = 'chatLinkHistory_' + (character.id ?? 'unknown');
            const historyStr = localStorage.getItem(historyKey);
            let weeklyChatCount = 0;
            
            if (historyStr) {
              try {
                const history: string[] = JSON.parse(historyStr);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                weeklyChatCount = history.filter(ts => {
                  const date = new Date(ts);
                  return date >= sevenDaysAgo;
                }).length;
              } catch (e) {
                console.error('Error parsing chat history:', e);
              }
            }
            
            activeChats.push({
              character: character,
              chatLink: chatLink,
              timestamp: timestamp ? new Date(timestamp) : new Date(),
              chatCount: chatCount,
              weeklyChatCount: weeklyChatCount,
              selected: false
            });
          }
        });

        // Sort by most recent first
        this.activeChats = activeChats.sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
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

    const confirmed = confirm(`Are you sure you want to delete ${this.selectedCount} selected chat${this.selectedCount === 1 ? '' : 's'}?`);
    if (confirmed) {
      this.activeChats.forEach(chat => {
        if (chat.selected) {
          const chatLinkKey = 'chatLink_' + (chat.character.id ?? 'unknown');
          const timestampKey = 'chatLinkTimestamp_' + (chat.character.id ?? 'unknown');
          const counterKey = 'chatLinkCounter_' + (chat.character.id ?? 'unknown');
          const historyKey = 'chatLinkHistory_' + (chat.character.id ?? 'unknown');
          
          localStorage.removeItem(chatLinkKey);
          // Keep timestamp and counter for historical tracking
          // localStorage.removeItem(timestampKey);
          // localStorage.removeItem(counterKey);
          // localStorage.removeItem(historyKey);
        }
      });
      
      alert(`${this.selectedCount} chat${this.selectedCount === 1 ? '' : 's'} deleted successfully.`);
      this.loadActiveChats();
      this.selectAll = false;
    }
  }

  openChatLink(chat: ActiveChat) {
    window.open(chat.chatLink, '_blank');
  }
}
