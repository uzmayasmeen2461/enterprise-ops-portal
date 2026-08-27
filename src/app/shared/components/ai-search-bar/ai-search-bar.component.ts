import {
  Component, inject, output, signal, OnInit, OnDestroy
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AI_SEARCH_SERVICE, AiSearchResult } from '../../../core/services/ai-search.token';

// ─── AiSearchBarComponent ─────────────────────────────────────────────────────
// A self-contained search bar that:
//   1. Accepts freeform text input from the user
//   2. Passes it to the AI service
//   3. Emits the parsed result to the parent via @output()
//
// The component does NOT know about OperationsService or the search form.
// It only speaks one language: "here are the filters I parsed, parent — you decide
// what to do with them."
//
// This is the single-responsibility principle applied to Angular components.

@Component({
  selector: 'app-ai-search-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './ai-search-bar.component.html',
  styleUrl: './ai-search-bar.component.css'
})
export class AiSearchBarComponent implements OnInit, OnDestroy {

  // inject() with an InjectionToken — identical syntax to injecting a class.
  // Angular looks up AI_SEARCH_SERVICE in the provider tree and returns
  // whatever was registered (MockAiSearchService right now).
  private aiService = inject(AI_SEARCH_SERVICE);

  private destroy$ = new Subject<void>();

  // The text input — a standalone FormControl (not part of a FormGroup)
  // We use it to access the valueChanges Observable for debouncing
  queryControl = new FormControl('', { nonNullable: true });

  // Local UI state as signals
  loading       = signal(false);
  lastResult    = signal<AiSearchResult | null>(null);
  errorMessage  = signal<string | null>(null);

  // output() — the modern Angular 17+ signal-based alternative to @Output() EventEmitter
  //
  // React equivalent: an onFiltersResolved prop callback
  // Parent listens: <app-ai-search-bar (filtersResolved)="onAiResult($event)" />
  //
  // output() vs @Output():
  //   @Output() searchResult = new EventEmitter<AiSearchResult>();  ← old way
  //   searchResult = output<AiSearchResult>();                       ← new way
  // Both work identically in templates. output() is more concise and signal-consistent.
  filtersResolved = output<AiSearchResult>();

  ngOnInit(): void {
    // Wire up debounced auto-search as the user types.
    // The RxJS chain here:
    //
    //   valueChanges  — emits every keystroke
    //   debounceTime  — waits 600ms of silence before proceeding
    //   distinctUntilChanged — ignores if the value is same as last emission
    //   filter        — don't bother the AI service with empty/short strings
    //   switchMap     — cancels the previous in-flight parse if user types again
    //                   (same pattern as cancelling a previous fetch in React)
    //   takeUntil     — auto-unsubscribes when the component is destroyed
    this.queryControl.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      filter(q => q.trim().length >= 3),
      switchMap(q => {
        this.loading.set(true);
        this.errorMessage.set(null);
        return this.aiService.parseQuery(q);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: result => {
        this.loading.set(false);
        this.lastResult.set(result);
        this.filtersResolved.emit(result);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('AI search unavailable. Use the manual filters below.');
      }
    });
  }

  // Called when the user clicks the Search button explicitly
  onSearch(): void {
    const q = this.queryControl.value.trim();
    if (!q) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.lastResult.set(null);

    this.aiService.parseQuery(q)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.loading.set(false);
          this.lastResult.set(result);
          this.filtersResolved.emit(result);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('AI search unavailable. Use the manual filters below.');
        }
      });
  }

  onClear(): void {
    this.queryControl.setValue('');
    this.lastResult.set(null);
    this.errorMessage.set(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
