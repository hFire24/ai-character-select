import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Character, CharacterService } from '../../services/character.service';
import { CharacterModal } from '../character-modal/character-modal';

interface TreeNode {
  character: Character;
  children: TreeNode[];
  level: number;
}

@Component({
  selector: 'app-lineage',
  imports: [CommonModule, FormsModule, CharacterModal],
  templateUrl: './lineage.html',
  styleUrls: ['./lineage.scss']
})
export class Lineage {
  characters: Character[] = [];
  treeRoots: TreeNode[] = [];
  filteredRoots: TreeNode[] = [];
  searchTerm: string = '';
  expandedNodes: Set<number> = new Set();
  errorMessage: string = '';
  isMobile: boolean = false;
  showCard: boolean = false;
  selectedCharacter: Character | null = null;

  constructor(private characterService: CharacterService) {
    this.isMobile = window.innerWidth <= 768;
    this.characterService.getCharacters().subscribe(data => {
      // Filter out Future Sapphire (42) and Me (999)
      this.characters = data.filter(c => c.id !== 42 && c.id !== 999);

      const hanako: Character = {
        id: 5,
        name: 'Hanako the Anime Fan',
        description: 'Hanako\'s imaginative and whimsical personality shines through her love for moe anime, otaku culture, and denpa music. Her tastes reflect a fascination with kawaii and fantastical elements and a deep connection to the vibrant, often eccentric world of anime. After realizing that, in practice, Akane is more Hanako-like than Hanako, she was retconned from the Music Enjoyers\' lore on April 14, 2025. Akane gained Hanako\'s personality traits and music tastes as a result.',
        shortName: 'Hanako',
        img: 'extended/Hanako.png',
        generation: 1,
        status: 'retconned',
        tier: 0,
        color: 'pink',
        moe: 9,
        futuristic: 6,
        emotion: 'chaotic joy',
        pronouns: 'she/her',
        musicEnjoyer: true,
        link: '',
        interests: 'Anime music, denpa music, Nanahira, otaku culture, cosplay',
        purpose: 'Weeb out, get into the anime industry',
        funFact: 'Was the leader of the Music Enjoyers before Felix became the new leader; disappeared due to Akane fulfilling her purpose better than she could',
        creationDate: '2023-12-06'
      };
      this.characters.push(hanako);
      
      // Set inspiration relationships (component-only data)
      // Format: parent ID -> array of child IDs (children are inspired by parent)
      const inspirationMap: { [key: number]: number[] } = {
        1: [62, 63],
        2: [54],
        5: [11, 12, 1, 7, 24, 25, 28, 13, 14, 57],  // Hanako inspires these
        11: [19, 30, 74, 75],
        13: [15, 16, 23, 26, 27, 31],
        14: [20],
        15: [17, 18, 21, 65],
        25: [68],
        28: [79, 80],
        34: [38, 39, 40, 43],
        43: [59, 60],
        46: [72],
        49: [50, 51],
        51: [55, 88],
        66: [81, 82, 83, 85, 104],
        30: [35, 36, 48],
        27: [37, 47, 69, 86, 87, 91, 93, 102],
        83: [84],
        88: [95],
        37: [41],
        54: [56, 77, 78],
        35: [58, 89],
        21: [76],
        84: [96, 99, 100, 101, 103, 105],
        58: [64],
        19: [22]
        };

      // Validate: Check for characters with multiple parents
      const validationError = this.validateInspirationMap(inspirationMap);
      if (validationError) {
        this.errorMessage = validationError;
        return;
      }

      // Apply all relationships
      for (const [parentId, childIds] of Object.entries(inspirationMap)) {
        childIds.forEach(childId => {
          const child = this.characters.find(c => c.id === childId);
          if (child) {
            child.inspiredBy = Number(parentId);
          }
        });
      }
      
      this.buildTree();      
      this.filteredRoots = this.treeRoots;    
    });
  }

  validateInspirationMap(inspirationMap: { [key: number]: number[] }): string | null {
    const childParentMap = new Map<number, number[]>();
    
    // Track which children appear under which parents
    for (const [parentId, childIds] of Object.entries(inspirationMap)) {
      childIds.forEach(childId => {
        if (!childParentMap.has(childId)) {
          childParentMap.set(childId, []);
        }
        childParentMap.get(childId)!.push(Number(parentId));
      });
    }
    
    // Find characters with multiple parents
    const duplicates: string[] = [];
    childParentMap.forEach((parents, childId) => {
      if (parents.length > 1) {
        const child = this.characters.find(c => c.id === childId);
        const childName = child ? child.shortName : `ID ${childId}`;
        const parentNames = parents.map(pId => {
          const parent = this.characters.find(c => c.id === pId);
          return parent ? parent.shortName + ` (${pId})` : `ID ${pId}`;
        }).join(', ');
        duplicates.push(`${childName} (${childId}) has multiple parents: ${parentNames}`);
      }
    });
    
    if (duplicates.length > 0) {
      return `Error: Characters cannot have multiple parents!\n\n${duplicates.join('\n')}`;
    }
    
    return null;
  }

  getCharacterById(id: number): Character | undefined {
    return this.characters.find(character => character.id === id);
  }

  buildTree(): void {
    // Find all root characters (those who don't have inspiredBy or inspiredBy character doesn't exist)
    const roots = this.characters.filter(char => 
      !char.inspiredBy || !this.getCharacterById(char.inspiredBy)
    );

    // Sort roots: non-side characters first (by ID), then side characters (by ID)
    roots.sort((a, b) => this.sortCharacters(a, b));

    // Build tree for each root
    this.treeRoots = roots.map(root => this.buildNode(root, 0, new Set()));
  }

  sortCharacters(a: Character, b: Character): number {
    const aIsSide = a.status?.toLowerCase().includes('side') || false;
    const bIsSide = b.status?.toLowerCase().includes('side') || false;

    // If one is side and the other isn't, non-side comes first
    if (aIsSide && !bIsSide) return 1;
    if (!aIsSide && bIsSide) return -1;

    // Otherwise, sort by ID
    return a.id - b.id;
  }

  buildNode(character: Character, level: number, visited: Set<number>): TreeNode {
    // Prevent infinite loops
    if (visited.has(character.id)) {
      return { character, children: [], level };
    }

    visited.add(character.id);

    // Find all children (characters inspired by this one) and sort by ID (side characters last)
    const children = this.characters
      .filter(char => char.inspiredBy === character.id)
      .sort((a, b) => this.sortCharacters(a, b))
      .map(child => this.buildNode(child, level + 1, new Set(visited)));

    return { character, children, level };
  }

  getCharacterImage(node: TreeNode): string {
    if (!node.character.img) {
      return 'assets/Icons/extended/Unknown.png'; // Fallback image
    }
    return `assets/Icons/${node.character.img}`;
  }

  hasChildren(node: TreeNode): boolean {
    return node.children && node.children.length > 0;
  }

  getTotalDescendants(node: TreeNode): number {
    if (!node.children || node.children.length === 0) {
      return 0;
    }
    
    let count = node.children.length;
    node.children.forEach(child => {
      count += this.getTotalDescendants(child);
    });
    
    return count;
  }

  genClass(g: number) {
    return 'gen' + g;
  }

  toggleNode(nodeId: number): void {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
  }

  isExpanded(nodeId: number): boolean {
    return this.expandedNodes.has(nodeId);
  }

  performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRoots = this.treeRoots;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    // Deep clone to avoid modifying original tree
    const clonedRoots = JSON.parse(JSON.stringify(this.treeRoots));
    this.filteredRoots = this.filterNodes(clonedRoots, term);
    
    // Auto-expand ancestors of matches, but not the matches themselves
    this.autoExpandAncestors(this.filteredRoots, term);
  }

  private filterNodes(nodes: TreeNode[], term: string): TreeNode[] {
    return nodes.filter(node => {
      const nameMatch = node.character.shortName.toLowerCase().includes(term) ||
                       node.character.name.toLowerCase().includes(term);
      
      // Always recursively filter children
      let childrenFiltered: TreeNode[] = [];
      if (node.children.length > 0) {
        childrenFiltered = this.filterNodes(node.children, term);
      }
      
      // Always update the node's children to only include filtered results
      // (even if empty, to prevent showing unfiltered children)
      node.children = childrenFiltered;
      
      // Keep this node if it matches OR if it has any matching descendants
      return nameMatch || childrenFiltered.length > 0;
    });
  }

  private autoExpandAncestors(nodes: TreeNode[], term: string): void {
    nodes.forEach(node => {
      const isDirectMatch = node.character.shortName.toLowerCase().includes(term) ||
                           node.character.name.toLowerCase().includes(term);
      
      // Expand nodes that have children, whether they're matches or ancestors of matches
      // This ensures descendants are visible
      if (node.children.length > 0) {
        this.expandedNodes.add(node.character.id);
      }
      
      // Recursively process children
      if (node.children.length > 0) {
        this.autoExpandAncestors(node.children, term);
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredRoots = this.treeRoots;
  }

  expandAll(): void {
    this.expandedNodes.clear();
    this.addAllNodesToExpanded(this.filteredRoots);
  }

  collapseAll(): void {
    this.expandedNodes.clear();
  }

  resetExpansion(): void {
    this.expandedNodes.clear();
    if (this.searchTerm.trim()) {
      // Re-apply the auto-expand logic for search results
      this.autoExpandAncestors(this.filteredRoots, this.searchTerm.toLowerCase());
    }
  }

  private addAllNodesToExpanded(nodes: TreeNode[]): void {
    nodes.forEach(node => {
      if (node.children.length > 0) {
        this.expandedNodes.add(node.character.id);
        this.addAllNodesToExpanded(node.children);
      }
    });
  }

  getGeneration(level: number): number {
    return level + 1;
  }

  openCharacterModal(character: Character): void {
    this.selectedCharacter = character;
    this.showCard = true;
  }
}
