import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// input() is the modern Angular 17+ signal-based alternative to @Input()
// It creates a REQUIRED or optional input that components pass from outside
//
// React equivalent:
// interface StatCardProps { title: string; count: number; icon: string; color: string; }
// const StatCard = ({ title, count, icon, color }: StatCardProps) => { ... }

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  // input() — signal-based inputs (Angular 17+)
  // input.required() means the parent MUST pass this value
  // input('default') means it's optional with a fallback
  title    = input.required<string>();
  count    = input.required<number>();
  icon     = input.required<string>();
  color    = input<string>('primary');    // optional, defaults to 'primary'
  subtitle = input<string>('');           // optional caption below the count
}
