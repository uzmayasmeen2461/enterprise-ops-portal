import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AiSearchService, AiSearchResult } from './ai-search.token';
import { environment } from '../../../environments/environment';

// ─── Request / Response shapes ────────────────────────────────────────────────
// These interfaces describe exactly what goes over the wire.
// TypeScript enforces this at compile time — no `any` anywhere.

export interface AiSearchRequest {
  query: string;
}

// The raw JSON shape our Express server returns.
// Note: this matches AiSearchResult from ai-search.token.ts — but we keep
// it explicit here so the service can handle any future shape differences
// without leaking backend changes into the rest of the app.
interface AiGatewayResponse {
  filters: {
    status?:       'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING';
    priority?:     'HIGH' | 'MEDIUM' | 'LOW';
    sourceSystem?: 'CORE_SYS' | 'PAYMENT_HUB' | 'ORDER_GATEWAY' | 'PROCESSING_ENGINE';
    operationId?:  string;
    createdFrom?:  string;
    createdTo?:    string;
  };
  interpretation: string;
  confidence: 'HIGH' | 'LOW';
}

// ─── RealAiSearchService ──────────────────────────────────────────────────────
// Implements the same AiSearchService interface as MockAiSearchService.
// The component (AiSearchBarComponent) is injected via InjectionToken and
// never knows which implementation it's talking to.
//
// This is the Dependency Inversion Principle — high-level components depend
// on the abstraction (interface), not the concrete class.

@Injectable()  // no providedIn — registered via InjectionToken in app.config.ts
export class RealAiSearchService implements AiSearchService {

  private http = inject(HttpClient);

  // The base URL comes from the environment file.
  // In dev:  http://localhost:3000
  // In prod: https://api.your-domain.com  (set before production build)
  private readonly apiUrl = `${environment.apiBaseUrl}/api/ai/search`;

  parseQuery(query: string): Observable<AiSearchResult> {
    const trimmed = query.trim();

    // Guard against empty queries — return a LOW-confidence empty result
    // instead of making a pointless API call.
    // This is a client-side fast path; the backend validates too.
    if (!trimmed) {
      return throwError(() => new Error('Please enter a search query.'));
    }

    const body: AiSearchRequest = { query: trimmed };

    // ── HTTP call ─────────────────────────────────────────────────────────────
    // http.post<T>() returns an Observable<T>.
    // HttpClient automatically:
    //   - sets Content-Type: application/json
    //   - serialises the body to JSON
    //   - deserialises the response body from JSON to T
    //
    // React equivalent:
    //   fetch(url, { method: 'POST', body: JSON.stringify(body) })
    //     .then(r => r.json())
    //
    // The key difference: HttpClient returns an Observable, not a Promise.
    // Observables are lazy — nothing happens until someone subscribes.
    return this.http.post<AiGatewayResponse>(this.apiUrl, body).pipe(

      // ── map: transform the gateway response into AiSearchResult ─────────────
      // The component only ever works with AiSearchResult.
      // If the gateway response shape changes, only this map() needs updating.
      map((response): AiSearchResult => ({
        filters:        response.filters,
        interpretation: response.interpretation,
        confidence:     response.confidence
      })),

      // ── catchError: intercept HTTP errors and return user-friendly messages ─
      // Without this, an HTTP error would propagate as a raw HttpErrorResponse.
      // With this, the component receives a plain Error with a readable message.
      //
      // React equivalent: .catch(err => { throw new Error(friendlyMessage) })
      catchError((error: HttpErrorResponse) => {
        const message = this.buildErrorMessage(error);
        // throwError() creates an Observable that immediately errors.
        // The component's .subscribe({ error: ... }) handler receives this.
        return throwError(() => new Error(message));
      })
    );
  }

  // ── Error message builder ─────────────────────────────────────────────────
  // Maps HTTP status codes to messages a user can actually act on.
  // Keeps error-handling logic out of the component.
  private buildErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      // status 0 means the request never reached the server
      // (network down, CORS blocked, server not running)
      return 'Cannot reach the AI service. Check that the backend server is running.';
    }
    if (error.status === 400) {
      return 'Invalid search query. Please try rephrasing.';
    }
    if (error.status === 429) {
      return 'AI service rate limit reached. Please wait a moment and try again.';
    }
    if (error.status === 502 || error.status === 503) {
      // Our gateway returns 502 when the AI provider itself fails
      return error.error?.error ?? 'AI service is temporarily unavailable.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
