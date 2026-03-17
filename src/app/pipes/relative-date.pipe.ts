import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a date relative to today
 * - Today: "Today"
 * - Yesterday: "Yesterday"
 * - Other: "Jan 15" (short month + day)
 */
@Pipe({
  name: 'relativeDate',
  standalone: true
})
export class RelativeDatePipe implements PipeTransform {
  transform(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    const now = new Date();
    // Set both dates to midnight to compare calendar days, not 24-hour periods
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffMs = today.getTime() - compareDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}
