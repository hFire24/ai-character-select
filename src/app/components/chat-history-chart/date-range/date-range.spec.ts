import { HistoryDateRange } from './date-range';
import { ChatHistoryChart } from '../chat-history-chart';

describe('Date range handles', () => {
  let range: HistoryDateRange;
  beforeEach(() => {
    range = new HistoryDateRange();
    range.chart = {
      datasetStartDate: '2026-05-01', datasetEndDate: '2026-09-30',
      selectedStartDate: '2026-05-30', selectedEndDate: '2026-06-12', zoomLevel: 'custom'
    } as ChatHistoryChart;
  });

  it('keeps the stationary date fixed as the second handle crosses and continues moving', () => {
    range.updateRangeSlider('28', 'second');
    expect(range.chart.selectedStartDate).toBe('2026-05-29');
    expect(range.chart.selectedEndDate).toBe('2026-05-30');
    range.updateRangeSlider('27', 'second');
    expect(range.chart.selectedStartDate).toBe('2026-05-28');
    expect(range.firstHandleValue).toBe(29);
    expect(range.secondHandleValue).toBe(27);
    expect(range.rangeStartPercent).toBeLessThan(range.rangeEndPercent);
    range.updateRangeSlider('40', 'second');
    expect(range.chart.selectedStartDate).toBe('2026-05-30');
    expect(range.chart.selectedEndDate).toBe('2026-06-10');
  });

  it('lets the first handle pass the second, including through equal dates', () => {
    range.updateRangeSlider('42', 'first');
    expect(range.firstHandleValue).toBe(range.secondHandleValue);
    range.updateRangeSlider('43', 'first');
    expect(range.chart.selectedStartDate).toBe('2026-06-12');
    expect(range.chart.selectedEndDate).toBe('2026-06-13');
    range.updateRangeSlider('44', 'first');
    expect(range.chart.selectedStartDate).toBe('2026-06-12');
    expect(range.chart.selectedEndDate).toBe('2026-06-14');
  });

  it('selects duration presets and identifies custom durations', () => {
    range.setRecentDays(15);
    expect(range.durationPreset).toBe(15);
    expect(range.chart.selectedStartDate).toBe('2026-05-30');
    expect(range.chart.selectedEndDate).toBe('2026-06-13');
    range.updateDuration(20);
    expect(range.durationPreset).toBe('');
  });
});
