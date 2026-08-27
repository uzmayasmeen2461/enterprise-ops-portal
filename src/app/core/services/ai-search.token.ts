import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { OperationSearchFilters } from '../../shared/models/operation.model';

// ─── What the AI service does ─────────────────────────────────────────────────
// This interface is the CONTRACT between the rest of the app and the AI layer.
// The operations component only knows about this interface — it never imports
// the concrete implementation directly.
//
// Why? So we can swap mock → real LLM with a one-line change in app.config.ts,
// touching zero other files.

export interface AiSearchService {
  // Takes a plain English query, returns structured search filters as an Observable.
  // Returns Observable (not a Signal) because this is an async I/O operation
  // that will eventually be an HTTP call — Observables model that better than Signals.
  parseQuery(query: string): Observable<AiSearchResult>;
}

// The result the AI service hands back
export interface AiSearchResult {
  filters: OperationSearchFilters;   // The structured filters to apply
  interpretation: string;            // Human-readable explanation of what was parsed
  confidence: 'HIGH' | 'LOW';        // Did we parse confidently or guess?
}

// InjectionToken — a runtime token used to inject an interface.
// Interfaces are erased at compile time; this gives Angular something to look up at runtime.
//
// React equivalent: a Context object created with createContext()
// The token IS the "key" Angular uses to find the right provider.
export const AI_SEARCH_SERVICE = new InjectionToken<AiSearchService>(
  'AiSearchService'  // human-readable label for debugging / DevTools
);
