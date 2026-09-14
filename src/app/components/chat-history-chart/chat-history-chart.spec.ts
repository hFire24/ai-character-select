import { of } from 'rxjs';
import { ChatHistoryChart, CharacterHistorySeries } from './chat-history-chart';
import { Character, CharacterService } from '../../services/character.service';

describe('Chat history manual sorting', () => {
  let chart: ChatHistoryChart;
  const series = (id: number, status: string, counts: number[]): CharacterHistorySeries => ({
    character: { id, name: `Character ${id}`, shortName: `Character ${id}`, status } as Character,
    points: counts.map((count, index) => ({
      date: new Date(`2026-09-0${index + 1}T12:00:00`),
      dateKey: `2026-09-0${index + 1}`, count
    }))
  });
  const ids = () => chart.displayedSeries.map(item => item.character.id);

  beforeEach(() => {
    chart = new ChatHistoryChart({ getCharacters: () => of([]), getChatGPT: () => of([]) } as unknown as CharacterService);
    chart.series = [series(1, 'active', [5, 1]), series(2, 'inactive', [1, 5])];
    chart.selectedStartDate = '2026-09-01';
    chart.selectedEndDate = '2026-09-01';
    chart.sortBy = 'count';
    chart.sortDirection = 'desc';
  });

  it('holds the order across date changes until Sort is clicked', () => {
    expect(ids()).toEqual([1, 2]);
    chart.setDynamicSorting(false);
    chart.selectedStartDate = chart.selectedEndDate = '2026-09-02';
    expect(ids()).toEqual([1, 2]);
    chart.sortNow();
    expect(ids()).toEqual([2, 1]);
  });

  it('restores filtered rows in their held order and defers sort setting changes', () => {
    chart.setDynamicSorting(false);
    chart.statusFilter = 'inactive';
    expect(ids()).toEqual([2]);
    chart.sortBy = 'id';
    chart.statusFilter = 'all';
    expect(ids()).toEqual([1, 2]);
    chart.sortNow();
    expect(ids()).toEqual([2, 1]);
  });

  it('resumes automatic sorting when enabled', () => {
    chart.setDynamicSorting(false);
    chart.selectedStartDate = chart.selectedEndDate = '2026-09-02';
    chart.setDynamicSorting(true);
    expect(ids()).toEqual([2, 1]);
  });

  it('appends new characters without rearranging held rows', () => {
    chart.setDynamicSorting(false);
    chart.addCharacter(series(3, 'active', []).character);
    expect(ids()).toEqual([1, 2, 3]);
    chart.removeCharacter(1);
    expect(ids()).toEqual([2, 3]);
  });
});
