import { Component, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChatHistoryChart } from '../chat-history-chart';

@Component({
  selector: 'app-history-date-range',
  imports: [FormsModule],
  templateUrl: './date-range.html',
  styleUrl: './date-range.scss'
})
export class HistoryDateRange {
  @Input({ required: true }) chart!: ChatHistoryChart;

  isZoomLevel(days: number) { return this.chart.zoomLevel === days; }
  get hasSlidingZoom() { return typeof this.chart.zoomLevel === 'number'; }
  get slidingZoomDays() { return typeof this.chart.zoomLevel === 'number' ? this.chart.zoomLevel : 0; }

  get sliderMaximum() {
    return Math.max(0, this.dayNumber(this.fromKey(this.chart.datasetEndDate)) -
      this.dayNumber(this.fromKey(this.chart.datasetStartDate)) + 1 - this.slidingZoomDays);
  }

  get sliderValue() {
    return this.dayNumber(this.fromKey(this.chart.selectedStartDate)) - this.dayNumber(this.fromKey(this.chart.datasetStartDate));
  }

  get latestStartDate() {
    const date = this.fromKey(this.chart.datasetStartDate);
    date.setDate(date.getDate() + this.sliderMaximum);
    return this.toKey(date);
  }

  get canMoveBackward() { return this.sliderValue > 0; }
  get canMoveForward() { return this.sliderValue < this.sliderMaximum; }
  get selectedStart() { return this.fromKey(this.chart.selectedStartDate); }
  get selectedEnd() { return this.fromKey(this.chart.selectedEndDate); }

  setRecentDays(days: number) {
    this.chart.zoomLevel = days as 7 | 15 | 30 | 60 | 120;
    const end = this.fromKey(this.chart.datasetEndDate);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    this.chart.selectedStartDate = this.clamp(this.toKey(start), this.chart.datasetStartDate, this.chart.datasetEndDate);
    this.chart.selectedEndDate = this.chart.datasetEndDate;
  }

  reset() {
    this.chart.zoomLevel = 'full';
    this.chart.selectedStartDate = this.chart.datasetStartDate;
    this.chart.selectedEndDate = this.chart.datasetEndDate;
  }

  setCustom() { this.chart.zoomLevel = 'custom'; }

  updateCustomStart(value: string) {
    this.chart.selectedStartDate = this.clamp(value || this.chart.datasetStartDate, this.chart.datasetStartDate, this.chart.selectedEndDate);
  }

  updateCustomEnd(value: string) {
    this.chart.selectedEndDate = this.clamp(value || this.chart.datasetEndDate, this.chart.selectedStartDate, this.chart.datasetEndDate);
  }

  updateSlider(value: string) {
    const start = this.fromKey(this.chart.datasetStartDate);
    start.setDate(start.getDate() + Number(value));
    this.updateSlidingStart(this.toKey(start));
  }

  updateStartDate(value: string) {
    if (value) this.updateSlidingStart(this.clamp(value, this.chart.datasetStartDate, this.latestStartDate));
  }

  moveWindow(direction: -1 | 1) { this.moveBy(direction * this.slidingZoomDays); }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (!this.hasSlidingZoom || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const target = event.target as HTMLElement | null;
    const isSlider = target instanceof HTMLInputElement && target.type === 'range';
    if (!isSlider && (target?.matches('input, select, textarea') || target?.isContentEditable)) return;
    event.preventDefault();
    this.moveBy((event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? this.slidingZoomDays : 1));
  }

  formatDate(date: Date) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date); }

  private moveBy(days: number) {
    this.updateSlider(String(Math.max(0, Math.min(this.sliderMaximum, this.sliderValue + days))));
  }

  private updateSlidingStart(key: string) {
    const start = this.fromKey(key);
    const end = new Date(start);
    end.setDate(end.getDate() + this.slidingZoomDays - 1);
    this.chart.selectedStartDate = this.toKey(start);
    this.chart.selectedEndDate = this.clamp(this.toKey(end), this.chart.selectedStartDate, this.chart.datasetEndDate);
  }

  private fromKey(key: string) { return new Date(`${key}T12:00:00`); }
  private toKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  private dayNumber(date: Date) { return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000; }
  private clamp(value: string, min: string, max: string) { return value < min ? min : value > max ? max : value; }
}
