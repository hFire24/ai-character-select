import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdChecker } from './id-checker';
import { CharacterService } from '../../services/character.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('IdChecker', () => {
  let component: IdChecker;
  let fixture: ComponentFixture<IdChecker>;
  let characterService: CharacterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdChecker, HttpClientTestingModule],
      providers: [CharacterService]
    }).compileComponents();

    fixture = TestBed.createComponent(IdChecker);
    component = fixture.componentInstance;
    characterService = TestBed.inject(CharacterService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search', () => {
    expect(component.searchId).toBe('');
    expect(component.character).toBeNull();
    expect(component.notFound).toBe(false);
    expect(component.searched).toBe(false);
  });

  it('should search for a character by ID', () => {
    const mockCharacter = {
      id: 11,
      name: 'Felix the Raver',
      shortName: 'Felix',
      img: 'main/Felix.png',
      generation: 1,
      status: 'active',
      tier: 2,
      color: 'red',
      moe: 3,
      futuristic: 7,
      emotion: 'chaotic joy',
      pronouns: 'he/him',
      link: 'https://chatgpt.com/g/g-iFBbxiTYO',
      interests: 'EDM music',
      purpose: 'Discuss music',
      funFact: 'Leader of the Music Enjoyers',
      description: 'High-energy character'
    };

    spyOn(characterService, 'getCharacter').and.returnValue(of(mockCharacter));

    component.searchId = '11';
    component.searchById();

    expect(characterService.getCharacter).toHaveBeenCalledWith(11);
    expect(component.character).toEqual(mockCharacter);
    expect(component.notFound).toBe(false);
    expect(component.searched).toBe(true);
  });

  it('should handle invalid ID input', () => {
    component.searchId = 'abc';
    component.searchById();

    expect(component.notFound).toBe(true);
    expect(component.character).toBeNull();
    expect(component.searched).toBe(true);
  });

  it('should handle character not found', () => {
    spyOn(characterService, 'getCharacter').and.returnValue(of(null as any));

    component.searchId = '999';
    component.searchById();

    expect(component.notFound).toBe(true);
    expect(component.character).toBeNull();
    expect(component.searched).toBe(true);
  });

  it('should clear search', () => {
    component.searchId = '11';
    component.character = {} as any;
    component.notFound = true;
    component.searched = true;

    component.clearSearch();

    expect(component.searchId).toBe('');
    expect(component.character).toBeNull();
    expect(component.notFound).toBe(false);
    expect(component.searched).toBe(false);
  });

  it('should trigger search on enter key', () => {
    spyOn(component, 'searchById');
    const event = new Event('keyup.enter');
    spyOn(event, 'preventDefault');

    component.onEnter(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.searchById).toHaveBeenCalled();
  });
});
