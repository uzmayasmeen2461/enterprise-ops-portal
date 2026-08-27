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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { OperationsService } from '../../core/services/operations.service';
import { Operation, OperationStatus, OperationPriority, SourceSystem } from '../../shared/models/operation.model';
import { StatusFormatPipe } from '../../shared/pipes/status-format.pipe';
import { AiSearchBarComponent } from '../../shared/components/ai-search-bar/ai-search-bar.component';
import { AiSearchResult } from '../../core/services/ai-search.token';

@Component({
  selector: 'app-operations',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    StatusFormatPipe,
    AiSearchBarComponent
  ],
  templateUrl: './operations.component.html',
  styleUrl: './operations.component.css'
})
export class OperationsComponent implements OnInit, OnDestroy {

  private opsService = inject(OperationsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Subject used for clean unsubscription — we'll explain this in the walkthrough
  private destroy$ = new Subject<void>();

  // Table setup
  displayedColumns = ['operationId', 'status', 'priority', 'sourceSystem', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<Operation>([]);

  // ViewChild — gets a reference to the child MatPaginator and MatSort components
  // Angular equivalent of React's useRef() for DOM/component access
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Service signals read directly
  loading = this.opsService.loading;
  error   = this.opsService.error;

  // Local UI signal
  searchExpanded = signal(true);

  // Filter options for dropdowns
  readonly statuses: OperationStatus[]   = ['COMPLETED', 'FAILED', 'PENDING', 'PROCESSING'];
  readonly priorities: OperationPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  readonly sourceSystems: SourceSystem[]  = ['CORE_SYS', 'PAYMENT_HUB', 'ORDER_GATEWAY', 'PROCESSING_ENGINE'];

  // Search form
  searchForm: FormGroup = this.fb.group({
    operationId:  [''],
    status:       [''],
    priority:     [''],
    sourceSystem: [''],
    createdFrom:  [''],
    createdTo:    ['']
  });

  // Computed — is any filter active?
  hasActiveFilters = computed(() => {
    const v = this.searchForm.value;
    return Object.values(v).some(val => val !== '' && val !== null);
  });

  ngOnInit(): void {
    // Load initial data
    this.opsService.loadOperations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ops => this.updateDataSource(ops));

    // React to service signal changes (e.g. triggered by other components)
    // We use an effect-free approach: subscribe to the operations stream
  }

  ngAfterViewInit(): void {
    // Wire up paginator and sort AFTER the view is rendered
    // ViewChild references are only available after ngAfterViewInit
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onSearch(): void {
    const filters = this.searchForm.value;
    this.opsService.searchOperations(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ops => this.updateDataSource(ops));
  }

  // Called when the AI search bar emits a parsed result.
  // patchValue() — sets only the fields provided, leaving others untouched.
  // This is the key bridge: AI output → form state → service call.
  onAiResult(result: AiSearchResult): void {
    // Reset first so stale filter values don't bleed into the new search
    this.searchForm.reset({
      operationId: '', status: '', priority: '',
      sourceSystem: '', createdFrom: '', createdTo: ''
    });
    // Patch only the fields the AI identified — patchValue ignores extras
    this.searchForm.patchValue(result.filters);
    // Execute the search with the patched values
    this.onSearch();
  }

  onReset(): void {
    this.searchForm.reset({
      operationId: '', status: '', priority: '',
      sourceSystem: '', createdFrom: '', createdTo: ''
    });
    this.opsService.loadOperations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ops => this.updateDataSource(ops));
  }

  onViewDetail(op: Operation): void {
    this.router.navigate(['/operations', op.id]);
  }

  toggleSearch(): void {
    this.searchExpanded.set(!this.searchExpanded());
  }

  private updateDataSource(ops: Operation[]): void {
    this.dataSource.data = ops;
    // Re-wire paginator/sort after data update in case they were already set
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
  }

  // Clean up subscriptions when component is destroyed
  // This is the takeUntil pattern — industry standard for Angular subscriptions
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper for template — returns CSS class for a given status
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED:  'status--completed',
      FAILED:     'status--failed',
      PENDING:    'status--pending',
      PROCESSING: 'status--processing'
    };
    return map[status] ?? '';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      HIGH:   'priority--high',
      MEDIUM: 'priority--medium',
      LOW:    'priority--low'
    };
    return map[priority] ?? '';
  }
}
