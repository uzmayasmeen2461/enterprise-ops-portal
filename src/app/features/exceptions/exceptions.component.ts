import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

import { OperationsService } from '../../core/services/operations.service';
import { Operation, OperationPriority, SourceSystem } from '../../shared/models/operation.model';
import { StatusFormatPipe } from '../../shared/pipes/status-format.pipe';
import { HighlightDirective } from '../../shared/directives/highlight.directive';

// The Exceptions page is a focused view of FAILED operations only.
// It reuses OperationsService but applies a hard FAILED status filter
// before populating the table — no extra service layer needed.

@Component({
  selector: 'app-exceptions',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    StatusFormatPipe,
    // HighlightDirective — attribute directive that highlights rows on hover
    // Demonstrates how standalone directives are imported just like components
    HighlightDirective
  ],
  templateUrl: './exceptions.component.html',
  styleUrl: './exceptions.component.css'
})
export class ExceptionsComponent implements OnInit, AfterViewInit, OnDestroy {

  private opsService = inject(OperationsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();

  // Table
  displayedColumns = ['operationId', 'priority', 'sourceSystem', 'retryCount', 'errorMessage', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<Operation>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Service signals
  loading = this.opsService.loading;
  error   = this.opsService.error;

  // Local signals
  totalExceptions = signal(0);

  // Filter options
  readonly priorities: OperationPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  readonly sourceSystems: SourceSystem[]   = ['CORE_SYS', 'PAYMENT_HUB', 'ORDER_GATEWAY', 'PROCESSING_ENGINE'];

  filterForm: FormGroup = this.fb.group({
    operationId:  [''],
    priority:     [''],
    sourceSystem: ['']
  });

  // Computed — is any filter active?
  hasActiveFilters = computed(() => {
    const v = this.filterForm.value;
    return Object.values(v).some(val => val !== '' && val !== null);
  });

  ngOnInit(): void {
    this.opsService.loadOperations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ops => this.applyExceptionFilter(ops));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onFilter(): void {
    const { operationId, priority, sourceSystem } = this.filterForm.value;
    this.opsService.searchOperations({
      status: 'FAILED',
      operationId:  operationId  || undefined,
      priority:     priority     || undefined,
      sourceSystem: sourceSystem || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(ops => this.applyExceptionFilter(ops));
  }

  onReset(): void {
    this.filterForm.reset({ operationId: '', priority: '', sourceSystem: '' });
    this.opsService.loadOperations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ops => this.applyExceptionFilter(ops));
  }

  onViewDetail(op: Operation): void {
    this.router.navigate(['/operations', op.id]);
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      HIGH:   'priority--high',
      MEDIUM: 'priority--medium',
      LOW:    'priority--low'
    };
    return map[priority] ?? '';
  }

  // Restrict the data source to FAILED operations only,
  // then update the table and the exception count badge.
  private applyExceptionFilter(ops: Operation[]): void {
    const failed = ops.filter(o => o.status === 'FAILED');
    this.dataSource.data = failed;
    this.totalExceptions.set(failed.length);
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
