import { Injectable } from '@angular/core';
import { Operation, OperationStatus, OperationPriority, SourceSystem } from '../../shared/models/operation.model';

// Realistic mock data simulating an enterprise operations system
// In Phase 5 this gets replaced by real HTTP calls to a REST API

@Injectable({ providedIn: 'root' })
export class MockDataService {

  private readonly statuses: OperationStatus[] = ['COMPLETED', 'FAILED', 'PENDING', 'PROCESSING'];
  private readonly priorities: OperationPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  private readonly sources: SourceSystem[] = ['CORE_SYS', 'PAYMENT_HUB', 'ORDER_GATEWAY', 'PROCESSING_ENGINE'];
  private readonly assignees = ['alex.reed', 'morgan.blake', 'sam.carter', 'jordan.hayes', 'taylor.brooks'];
  private readonly currencies = ['USD', 'EUR', 'GBP', 'JPY'];

  private readonly errorMessages: Record<string, string> = {
    CORE_SYS:           'Timeout connecting to CORE_SYS after 30s',
    PAYMENT_HUB:        'PAYMENT_HUB rejected request: validation failed',
    ORDER_GATEWAY:      'ORDER_GATEWAY returned error: missing required fields',
    PROCESSING_ENGINE:  'PROCESSING_ENGINE unavailable: service temporarily offline'
  };

  generateOperations(count = 50): Operation[] {
    return Array.from({ length: count }, (_, i) => this.createOperation(i + 1));
  }

  private createOperation(index: number): Operation {
    const status = this.statuses[index % this.statuses.length];
    const source = this.sources[index % this.sources.length];
    const priority = this.priorities[index % this.priorities.length];

    // Spread operations across the last 90 days
    const createdDate = this.randomDate(90);
    const updatedDate = this.randomDate(10, new Date(createdDate));

    return {
      id: `${index}`,
      operationId: `OPS-${String(index).padStart(5, '0')}`,
      status,
      priority,
      sourceSystem: source,
      description: `${source} ${this.operationDescription(status)} — ref #${index}`,
      createdDate,
      updatedDate,
      assignedTo: this.assignees[index % this.assignees.length],
      errorMessage: status === 'FAILED' ? this.errorMessages[source] : undefined,
      retryCount: status === 'FAILED' ? Math.floor(Math.random() * 3) + 1 : 0,
      amount: Math.round((Math.random() * 999000 + 1000) * 100) / 100,
      currency: this.currencies[index % this.currencies.length]
    };
  }

  private operationDescription(status: OperationStatus): string {
    const map: Record<OperationStatus, string> = {
      COMPLETED:  'batch operation completed successfully',
      FAILED:     'batch operation failed',
      PENDING:    'batch operation pending approval',
      PROCESSING: 'batch operation in progress'
    };
    return map[status];
  }

  private randomDate(daysAgo: number, after?: Date): string {
    const base = after ?? new Date();
    const ms = Math.random() * daysAgo * 24 * 60 * 60 * 1000;
    return new Date(base.getTime() - ms).toISOString();
  }
}
