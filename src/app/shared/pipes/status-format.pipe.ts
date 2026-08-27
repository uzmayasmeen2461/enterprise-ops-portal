import { Pipe, PipeTransform } from '@angular/core';

// Pure pipe — only re-runs when the input value reference changes
// This is the default and what you should always use unless you have a
// specific reason (e.g. the pipe depends on external mutable state)
//
// Usage in template:
//   {{ 'FAILED' | statusFormat }}          → 'Failed'
//   {{ 'PENDING_REVIEW' | statusFormat }}  → 'Pending Review'
//   {{ 'IN_PROGRESS' | statusFormat }}     → 'In Progress'

@Pipe({
  name: 'statusFormat',
  standalone: true,
  pure: true
})
export class StatusFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')                        // PENDING_REVIEW → PENDING REVIEW
      .toLowerCase()                             // PENDING REVIEW → pending review
      .replace(/\b\w/g, c => c.toUpperCase());   // pending review → Pending Review
  }
}
