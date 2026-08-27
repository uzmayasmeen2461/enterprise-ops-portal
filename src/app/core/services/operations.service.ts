import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';

import { Operation, OperationSearchFilters, DashboardStats } from '../../shared/models/operation.model';
import { MockDataService } from './mock-data.service';

@Injectable({ providedIn: 'root' })
export class OperationsService {

  // ─── Private state signals ────────────────────────────────────────────────
  // Only this service writes to these. Components read via public computed().

  private _operations = signal<Operation[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // ─── Public read-only signals ─────────────────────────────────────────────
  // Components inject this service and read these — they cannot write.

  operations = this._operations.asReadonly();
  loading    = this._loading.asReadonly();
  error      = this._error.asReadonly();

  // ─── Computed / derived state ─────────────────────────────────────────────
  // These re-evaluate automatically whenever _operations changes.
  // No manual subscription or state sync needed.

  stats = computed<DashboardStats>(() => {
    const ops = this._operations();
    return {
      total:       ops.length,
      completed:   ops.filter(o => o.status === 'COMPLETED').length,
      failed:      ops.filter(o => o.status === 'FAILED').length,
      pending:     ops.filter(o => o.status === 'PENDING').length,
      processing:  ops.filter(o => o.status === 'PROCESSING').length,
      highPriority: ops.filter(o => o.priority === 'HIGH').length
    };
  });

  constructor(private mockData: MockDataService) {}

  // ─── Methods ──────────────────────────────────────────────────────────────

  loadOperations(): Observable<Operation[]> {
    this._loading.set(true);
    this._error.set(null);

    // of() creates an Observable from a value — like Promise.resolve()
    // delay() simulates network latency
    // tap() lets us run side effects (setting signals) without changing the stream
    return of(this.mockData.generateOperations(50)).pipe(
      delay(600),
      tap({
        next: ops => {
          this._operations.set(ops);
          this._loading.set(false);
        },
        error: err => {
          this._error.set('Failed to load operations. Please try again.');
          this._loading.set(false);
        }
      })
    );
  }

  searchOperations(filters: OperationSearchFilters): Observable<Operation[]> {
    this._loading.set(true);

    const allOps = this.mockData.generateOperations(50);

    // Apply filters client-side for now — in Phase 5 these become query params
    const filtered = allOps.filter(op => {
      if (filters.operationId && !op.operationId.toLowerCase()
            .includes(filters.operationId.toLowerCase())) return false;
      if (filters.status     && op.status       !== filters.status)       return false;
      if (filters.priority   && op.priority     !== filters.priority)     return false;
      if (filters.sourceSystem && op.sourceSystem !== filters.sourceSystem) return false;
      if (filters.createdFrom && op.createdDate < filters.createdFrom)    return false;
      if (filters.createdTo  && op.createdDate > filters.createdTo)       return false;
      return true;
    });

    return of(filtered).pipe(
      delay(400),
      tap(ops => {
        this._operations.set(ops);
        this._loading.set(false);
      })
    );
  }

  getOperationById(id: string): Observable<Operation | undefined> {
    const op = this._operations().find(o => o.id === id)
            ?? this.mockData.generateOperations(50).find(o => o.id === id);
    return of(op).pipe(delay(300));
  }
}
