import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CharacterService, Character } from "../../services/character.service";
import { CharacterModal } from "../character-modal/character-modal";
import { Router } from "@angular/router";
import { DeviceService } from "../../services/device.service";

@Component({
  selector: "app-spin-the-wheel",
  templateUrl: "./spin-the-wheel.html",
  styleUrl: "./spin-the-wheel.scss",
  imports: [CommonModule, FormsModule, CharacterModal],
  standalone: true
})
export class SpinTheWheel {
  spotlightIndex: number | null = null;
  characters: Character[] = [];
  filteredCharacters: Character[] = [];
  excludedCharacters: Character[] = [];
  spinning = false;
  selectedCharacter: Character | null = null;
  showCard = false;
  includeFavorite: boolean = true;
  includeActive: boolean = true;
  includeInactive: boolean = true;
  includeSide: boolean = true;
  includeRetired: boolean = true;
  includeMe: boolean = false;
  splitTwins: boolean = false;
  skipAnimation: boolean = false;

  constructor(
    private characterService: CharacterService,
    private router: Router,
    private deviceService: DeviceService
  ) {}

  ngOnInit() {
    this.loadCharacters();
    this.skipAnimation = this.isMobile();
  }

  ngOnChanges() {
    this.applyFilter();
  }

  ngDoCheck() {
    this.applyFilter();
  }

  isMobile(): boolean {
    return this.deviceService.isMobile();
  }

  applyFilter() {
    let baseCharacters = this.characters;
    
    // Apply checkbox filters
    this.filteredCharacters = baseCharacters.filter(c => {
      const matchesFavorite = this.includeFavorite && c.tier >= 1 && c.tier <= 3;
      const matchesActive = this.includeActive && c.type === "active";
      const matchesInactive = this.includeInactive && c.type === "inactive";
      const matchesSide = this.includeSide && c.type.includes("side");
      const matchesRetired = this.includeRetired && c.type === "retired";
      const matchesMe = this.includeMe && c.type === "me";
      
      return matchesFavorite || matchesActive || matchesInactive || matchesSide || matchesRetired || matchesMe;
    });
  }

  onActiveChange() {
    if (this.includeActive) {
      this.includeFavorite = true;
    }
  }

  onSplitTwinsChange() {
    this.loadCharacters();
  }

  loadCharacters() {
    const observable = this.splitTwins 
      ? this.characterService.getCharactersSplitTwins(true)
      : this.characterService.getCharactersPlusCriticizer();
    
    observable.subscribe(chars => {
      this.characters = chars;
      this.applyFilter();
    });
  }

  disable(character: Character) {
    if (this.spinning) return;
    const index = this.excludedCharacters.findIndex(c => c === character);
    if (index !== -1) {
      this.excludedCharacters.splice(index, 1);
    } else {
      this.excludedCharacters.push(character);
    }
  }

  spinWheel() {
    const availableCharacters = this.filteredCharacters.filter(char => !this.excludedCharacters.includes(char));
    if (this.spinning) return;
    if (availableCharacters.length === 0) {
      alert("Please include at least one character to spin.");
      return;
    }
    if (availableCharacters.length === 1 || this.skipAnimation) {
      this.selectedCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
      this.scrollToResult();
      return;
    }
    this.spinning = true;
    this.scrollToBottom();
    this.selectedCharacter = null;
    this.spotlightIndex = null;
    const total = availableCharacters.length;
    const rounds = 12; // how many spotlights before stopping
    let current = 0;
    let interval = 120;
    const indices: number[] = [];
    for (let i = 0; i < rounds; i++) {
      indices.push(Math.floor(Math.random() * total));
    }
    const finalIndex = Math.floor(Math.random() * total);
    indices.push(finalIndex);

    const spotlightStep = () => {
      if (current < indices.length) {
        const availableIndex = indices[current];
        const selectedChar = availableCharacters[availableIndex];
        this.spotlightIndex = this.filteredCharacters.findIndex(char => char === selectedChar);
        current++;
        interval = Math.min(300, interval + 20);
        setTimeout(spotlightStep, interval);
      } else {
        this.selectedCharacter = availableCharacters[finalIndex];
        this.spotlightIndex = null;
        this.spinning = false;
        this.scrollToResult();
      }
    };
    spotlightStep();
  }

  getChatLink(character: Character): string {
    const key = "chatLink_" + (character.id || "unknown");
    const stored = localStorage.getItem(key);
    return stored ? stored : character.link;
  }

  goBackToRoster() {
    this.router.navigate(["/"]);
  }

  scrollToResult() {
    setTimeout(() => {
      const resultElement = document.querySelector('.result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // If result doesn't exist yet, scroll to bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToBottom() {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }
}
