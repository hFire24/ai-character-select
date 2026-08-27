import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChatHistoryChart } from '../chat-history-chart';

@Component({
  selector: 'app-history-chart-controls',
  imports: [FormsModule],
  templateUrl: './chart-controls.html',
  styleUrl: './chart-controls.scss'
})
export class HistoryChartControls {
  @Input({ required: true }) chart!: ChatHistoryChart;
}
