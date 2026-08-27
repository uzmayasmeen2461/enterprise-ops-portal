import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import { AiSearchService, AiSearchResult } from './ai-search.token';
import { OperationSearchFilters, OperationStatus, OperationPriority, SourceSystem } from '../../shared/models/operation.model';

// ─── Mock AI Search Service ───────────────────────────────────────────────────
// In production this becomes an HTTP call to an LLM endpoint.
// The interface (AiSearchService) stays the same — only this file changes.
//
// The parsing strategy here is simple keyword matching.
// A real LLM would use semantic understanding, handle typos, synonyms, etc.

@Injectable()   // NOTE: no providedIn here — we provide it via InjectionToken in app.config.ts
export class MockAiSearchService implements AiSearchService {

  parseQuery(query: string): Observable<AiSearchResult> {
    const q = query.toLowerCase().trim();
    const filters: OperationSearchFilters = {};
    const matched: string[] = [];

    // ── Status detection ─────────────────────────────────────────────────────
    const statusMap: Record<string, OperationStatus> = {
      'failed':     'FAILED',
      'failure':    'FAILED',
      'error':      'FAILED',
      'completed':  'COMPLETED',
      'complete':   'COMPLETED',
      'done':       'COMPLETED',
      'pending':    'PENDING',
      'waiting':    'PENDING',
      'processing': 'PROCESSING',
      'in progress':'PROCESSING',
      'running':    'PROCESSING'
    };

    for (const [keyword, status] of Object.entries(statusMap)) {
      if (q.includes(keyword)) {
        filters.status = status;
        matched.push(`status → ${status}`);
        break;
      }
    }

    // ── Priority detection ────────────────────────────────────────────────────
    const priorityMap: Record<string, OperationPriority> = {
      'high priority': 'HIGH',
      'high-priority': 'HIGH',
      'urgent':        'HIGH',
      'critical':      'HIGH',
      'high':          'HIGH',
      'medium':        'MEDIUM',
      'normal':        'MEDIUM',
      'low priority':  'LOW',
      'low':           'LOW'
    };

    // Check longer phrases first to avoid partial matches
    const priorityKeys = Object.keys(priorityMap).sort((a, b) => b.length - a.length);
    for (const keyword of priorityKeys) {
      if (q.includes(keyword)) {
        filters.priority = priorityMap[keyword];
        matched.push(`priority → ${priorityMap[keyword]}`);
        break;
      }
    }

    // ── Source system detection ───────────────────────────────────────────────
    const sourceMap: Record<string, SourceSystem> = {
      'core sys':          'CORE_SYS',
      'core_sys':          'CORE_SYS',
      'core':              'CORE_SYS',
      'payment hub':       'PAYMENT_HUB',
      'payment_hub':       'PAYMENT_HUB',
      'payment':           'PAYMENT_HUB',
      'order gateway':     'ORDER_GATEWAY',
      'order_gateway':     'ORDER_GATEWAY',
      'order':             'ORDER_GATEWAY',
      'processing engine': 'PROCESSING_ENGINE',
      'processing_engine': 'PROCESSING_ENGINE',
      'engine':            'PROCESSING_ENGINE'
    };

    for (const [keyword, source] of Object.entries(sourceMap)) {
      if (q.includes(keyword)) {
        filters.sourceSystem = source;
        matched.push(`source → ${source}`);
        break;
      }
    }

    // ── Date shortcuts ────────────────────────────────────────────────────────
    if (q.includes('today')) {
      const today = new Date().toISOString().split('T')[0];
      filters.createdFrom = today;
      filters.createdTo   = today;
      matched.push('date → today');
    } else if (q.includes('this week')) {
      const now  = new Date();
      const mon  = new Date(now);
      mon.setDate(now.getDate() - now.getDay() + 1);
      filters.createdFrom = mon.toISOString().split('T')[0];
      filters.createdTo   = now.toISOString().split('T')[0];
      matched.push('date → this week');
    } else if (q.includes('yesterday')) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      filters.createdFrom = yStr;
      filters.createdTo   = yStr;
      matched.push('date → yesterday');
    }

    // ── Build interpretation string ───────────────────────────────────────────
    const interpretation = matched.length > 0
      ? `Understood: ${matched.join(', ')}`
      : 'No filters recognised — showing all operations';

    const confidence: 'HIGH' | 'LOW' = matched.length > 0 ? 'HIGH' : 'LOW';

    // Simulate async latency (as if calling a real API)
    return of({ filters, interpretation, confidence }).pipe(delay(500));
  }
}
