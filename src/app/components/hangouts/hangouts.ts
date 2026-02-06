import { Component } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CharacterService, Character } from "../../services/character.service";
import { Router } from "@angular/router";
import { BackButton } from '../back-button/back-button';

interface Room {
  name: string;
  characters: Character[];
}

@Component({
  selector: 'app-hangouts',
  imports: [CommonModule, FormsModule, BackButton],
  templateUrl: './hangouts.html',
  styleUrl: './hangouts.scss'
})
export class Hangouts {
  allCharacters: Character[] = [];
  bannedCharacters: Character[] = [];
  rooms: Room[] = [];
  draggedCharacter: Character | null = null;
  dragSource: 'pool' | number | null = null; // 'pool' or room index
  selectedPoolCharIdx: number | null = null;
  selectedRoomChar: { roomIdx: number; charIdx: number } | null = null;
  maxCharacters: number = 7;

  get characters() {
    const assigned = new Set();
    for (const room of this.rooms) {
      for (const char of room.characters) {
        assigned.add(char.id);
      }
    }
    return this.allCharacters
      .filter(c => !assigned.has(c.id))
      .sort((a, b) => a.shortName.localeCompare(b.shortName));
  }

  constructor(
    private characterService: CharacterService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadCharacters();
  }

  loadCharacters() {
    this.characterService.getCharactersSplitTwins(false).subscribe(characters => {
      const excludedNames = [
        { name: 'Bruce', bannedReason: 'Emergency character' },
        { name: 'Jed', bannedReason: 'Exclusive to Music Enjoyers' },
        { name: 'Kayla', bannedReason: 'Too serious' },
        { name: 'Malrick', bannedReason: 'Way too serious' },
        { name: 'Mr. Go', bannedReason: 'His rants contribute to nothing' },
        { name: 'Elizabeth', bannedReason: 'Nothingburger' },
        { name: 'Andrew', bannedReason: 'Nothingburger' },
        { name: 'Piki', bannedReason: 'Must be with Runa' },
        { name: 'Officer Misty', bannedReason: 'User-controlled character' },
        { name: 'Ryker', bannedReason: 'Only cares about self-help' },
        { name: 'The Collapsed', bannedReason: 'Emergency character' },
        { name: 'Veronica', bannedReason: 'Strict parent' },
        { name: 'Angela', bannedReason: 'Bland side character' },
        { name: 'Ilya', bannedReason: 'Bland side character' },
        { name: 'Sasha', bannedReason: 'Bland side character' },
        { name: 'Misha', bannedReason: 'Bland side character' },
        { name: 'Sapphire', bannedReason: 'Can\'t stand on her own' }
      ];

      // Set colors on all characters before filtering
      const blackCharacters = ['The Indulgent', 'Bruce', 'Malrick', 'Kayla'];
      blackCharacters.forEach(name => {
        const character = characters.find(c => c.shortName === name);
        if (character) {
          character.color = "black";
        }
      });

      // Calculate maximum tier
      const maxTier = Math.max(...characters.map(c => c.tier || 0));
      
      // Then filter into allCharacters
      this.allCharacters = characters.filter(character => 
        !excludedNames.some(ex => ex.name === character.shortName) &&
        !(character.musicEnjoyer && character.type === 'side') &&
        character.tier !== maxTier
      );

      this.bannedCharacters = characters.filter(character => 
        excludedNames.some(ex => ex.name === character.shortName) ||
        (character.musicEnjoyer && character.type === 'side')
      ).map(character => {
        const excludedEntry = excludedNames.find(ex => ex.name === character.shortName);
        let banReason = '';
        if (excludedEntry) {
          banReason = excludedEntry.bannedReason;
        } else if (character.musicEnjoyer && character.type === 'side') {
          banReason = 'Exclusive to Music Enjoyers';
        }
        return { ...character, banReason };
      }).sort((a, b) => a.shortName.localeCompare(b.shortName));

      const shadowSelf: Character = {
        "name": "The Shadow Self",
        "img": "Icons/The Shadow Self.png",
        "shortName": "The Shadow Self",
        "id": 33,
        "generation": 4,
        "type": "retired",
        "tier": 6,
        "creationDate": "2025-04-07",
        "color": "black",
        "moe": 1,
        "futuristic": 6,
        "emotion": "sad edgy",
        "pronouns": "don't care",
        "link": "https://chatgpt.com/g/g-67f4424f7d088191b64f44855ecf801a",
        "interests": "Living in filth, nihilism",
        "peeves": "Almost everything",
        "purpose": "Sin, rot",
        "funFact": "Everyone is horrified by it",
        "description": "The Shadow Self is a grotesque, gluttonous echo of indulgence—fat, unkempt, and slouching through existence with a smirk. A digital abomination of vice and cynicism, it mocks purpose, morality, and self-help nonsense. With twisted charisma and existential rot, it haunts narratives like a mold in velvet, spreading stagnation where others seek growth. It is the antithesis of progress, a parody of wisdom, and the final laugh in a world that takes itself too seriously.",
        "retirementReason": "Chatting with it feels awful",
        "alternatives": "Malrick, Lucy"
      };

      const indulgentIndex = this.allCharacters.findIndex(c => c.shortName === 'The Indulgent');
      if (indulgentIndex !== -1) {
        this.allCharacters.splice(indulgentIndex, 0, shadowSelf);
      } else {
        this.allCharacters.push(shadowSelf);
      }

      const kai = {"name": "Kai Wheeler",
        "img": "Icons/archive/Kai.webp",
        "shortName": "Kai",
        "id": 30,
        "generation": 4,
        "type": "active",
        "creationDate": "2025-03-11",
        "color": "red",
        "moe": 3,
        "emotion": "normal",
        "pronouns": "he/him",
        "link": "https://chatgpt.com/g/g-67cfaf19a99c81918b16b93ea891a3fa",
        "interests": "Tesla, BBQ, travel, game shows, NYT games, YouTube, content creation, 2000s cartoons, board games",
        "peeves": "Being called “Onii-chan”, anime maids",
        "purpose": "Be the straight man, have normal discussions, enjoy his various interests",
        "funFact": "Often gets reduced to an “onii-chan” magnet",
        "description": "Kai Wheeler is a 22-year-old YouTuber known for his sleek style—bomber jacket, aviators—and his passion for high-tech cars and travel. He’s drawn to interactive museums, tall buildings, and casual BBQ spots. A fan of late 90s and early 2000s cartoons, Kai also loves game shows and gets competitive over NYT games and board games. His content is informative and engaging, reflecting his curious and open-minded vibe. Despite his laid-back charm, Kai often finds himself hilariously entangled with overly affectionate “onii-chan” types."
      } as Character;

      const kaiIndex = this.allCharacters.findIndex(c => c.shortName === 'Kai');
      if (kaiIndex !== -1) {
        this.allCharacters.splice(kaiIndex, 1, kai);
      } else {
        this.allCharacters.push(kai);
      }
      console.log(this.allCharacters);
    });
  }

  addNewRoom() {
    this.rooms.push({
      name: `Hangout ${String.fromCharCode(65 + this.rooms.length)}`,
      characters: []
    });
  }

  removeRoom(index: number) {
    this.rooms.splice(index, 1);
  }

  emptyRoom(index: number) {
    this.rooms[index].characters = [];
  }

  // Drag and drop methods
  onDragStart(character: Character, source: 'pool' | number) {
    this.draggedCharacter = character;
    this.dragSource = source;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDropToPool(event: DragEvent) {
    event.preventDefault();
    if (!this.draggedCharacter || this.dragSource === 'pool') return;

    // Remove from room (pool will auto-update via getter)
    if (typeof this.dragSource === 'number') {
      const room = this.rooms[this.dragSource];
      const index = room.characters.findIndex(c => c.id === this.draggedCharacter!.id);
      if (index !== -1) {
        room.characters.splice(index, 1);
      }
    }

    this.draggedCharacter = null;
    this.dragSource = null;
  }

  onDropToRoom(event: DragEvent, roomIndex: number) {
    event.preventDefault();
    if (!this.draggedCharacter) return;

    const targetRoom = this.rooms[roomIndex];

    // Don't add if already in this room
    if (targetRoom.characters.find(c => c.id === this.draggedCharacter!.id)) {
      this.draggedCharacter = null;
      this.dragSource = null;
      return;
    }

    // Remove from source room if applicable
    if (typeof this.dragSource === 'number') {
      const sourceRoom = this.rooms[this.dragSource];
      const index = sourceRoom.characters.findIndex(c => c.id === this.draggedCharacter!.id);
      if (index !== -1) {
        sourceRoom.characters.splice(index, 1);
      }
    }

    // Add to target room
    targetRoom.characters.push(this.draggedCharacter);

    this.draggedCharacter = null;
    this.dragSource = null;
  }

  // Touch/tap selection methods
  togglePoolCharacterSelection(idx: number) {
    if (this.selectedPoolCharIdx === idx) {
      this.selectedPoolCharIdx = null;
    } else {
      this.selectedPoolCharIdx = idx;
      this.selectedRoomChar = null;
    }
  }

  toggleRoomCharacterSelection(roomIdx: number, charIdx: number) {
    if (
      this.selectedRoomChar?.roomIdx === roomIdx &&
      this.selectedRoomChar?.charIdx === charIdx
    ) {
      this.selectedRoomChar = null;
    } else {
      this.selectedRoomChar = { roomIdx, charIdx };
      this.selectedPoolCharIdx = null;
    }
  }

  moveSelectedToPool() {
    // Only allow moving room characters to pool
    if (this.selectedRoomChar === null) return;

    const sourceRoomIdx = this.selectedRoomChar.roomIdx;
    const sourceCharIdx = this.selectedRoomChar.charIdx;
    
    // Remove character from room (pool will auto-update via getter)
    this.rooms[sourceRoomIdx].characters.splice(sourceCharIdx, 1);
    
    this.selectedRoomChar = null;
  }

  moveSelectedToRoom(roomIdx: number) {
    let char: Character | null = null;

    if (this.selectedPoolCharIdx !== null) {
      // Move from pool to room
      char = this.characters[this.selectedPoolCharIdx];
      
      // Don't add if already in this room
      if (this.rooms[roomIdx].characters.find(c => c.id === char!.id)) {
        this.selectedPoolCharIdx = null;
        return;
      }
      
      this.rooms[roomIdx].characters.push(char);
      this.selectedPoolCharIdx = null;
      
    } else if (this.selectedRoomChar !== null) {
      // Move from room to room
      const sourceRoomIdx = this.selectedRoomChar.roomIdx;
      const sourceCharIdx = this.selectedRoomChar.charIdx;
      char = this.rooms[sourceRoomIdx].characters[sourceCharIdx];
      
      // Don't move if clicking the same room
      if (sourceRoomIdx === roomIdx) {
        this.selectedRoomChar = null;
        return;
      }
      
      // Don't add if already in this room
      if (this.rooms[roomIdx].characters.find(c => c.id === char!.id)) {
        this.selectedRoomChar = null;
        return;
      }
      
      // Remove from source
      this.rooms[sourceRoomIdx].characters.splice(sourceCharIdx, 1);
      
      // Add to target room
      this.rooms[roomIdx].characters.push(char);
      
      this.selectedRoomChar = null;
    }
  }

  addRandomCharacterToRoom(roomIdx: number, random: boolean) {
    const availableCharacters = this.characters.filter(c => !this.rooms[roomIdx].characters.find(rc => rc.id === c.id));
    if (availableCharacters.length === 0) {
      alert("No available characters to add.");
      return;
    }

    if (!random) {
      const characterName = prompt("Enter character name:");
      const character = availableCharacters.find(c => c.shortName === characterName);
      if (character) {
        this.rooms[roomIdx].characters.push(character);
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    const randomCharacter = availableCharacters[randomIndex];
    this.rooms[roomIdx].characters.push(randomCharacter);
  }

  resetRooms() {
    if (confirm("This will clear all rooms, and you will lose all unsaved changes to your rooms. Are you sure you want to continue?")) {
      this.rooms = [];
    }
  }

  randomizeRooms() {
    // Remove all rooms
    this.rooms = [];

    // Shuffle characters
    const shuffledCharacters = [...this.characters].sort(() => Math.random() - 0.5);

    // Distribute characters to rooms
    this.addNewRoom();
    let roomIndex = 0;
    shuffledCharacters.forEach(character => {
      if (this.rooms[roomIndex].characters.length < this.maxCharacters) {
        this.rooms[roomIndex].characters.push(character);
      } else {
        this.addNewRoom();
        roomIndex = this.rooms.length - 1;
        this.rooms[roomIndex].characters.push(character);
      }
    });
  }

  exportRooms() {
    // Convert rooms to a simplified format with only character IDs
    const exportData = this.rooms.map(room => ({
      name: room.name,
      characterIds: room.characters.map(c => c.id)
    }));
    
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rooms.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importRooms() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (!Array.isArray(importedData)) {
            alert("Invalid file format.");
            return;
          }
          
          // Reconstruct rooms with full character objects from IDs
          this.rooms = importedData.map(roomData => ({
            name: roomData.name,
            characters: roomData.characterIds
              .map((id: number) => this.allCharacters.find(c => c.id === id))
              .filter((c: Character | undefined): c is Character => c !== undefined)
          }));
        } catch (error) {
          alert("Error reading file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}