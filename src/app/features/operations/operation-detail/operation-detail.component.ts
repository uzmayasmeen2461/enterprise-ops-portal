import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OperationsService } from '../../../core/services/operations.service';
import { Operation } from '../../../shared/models/operation.model';
import { StatusFormatPipe } from '../../../shared/pipes/status-format.pipe';

@Component({
  selector: 'app-operation-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    StatusFormatPipe
  ],
  templateUrl: './operation-detail.component.html',
  styleUrl: './operation-detail.component.css'
})
export class OperationDetailComponent implements OnInit {

  // withComponentInputBinding() in app.config.ts makes this work —
  // the :id route param is automatically injected into this @Input()
  // No need to inject ActivatedRoute and manually extract params
  @Input() id!: string;

  private opsService = inject(OperationsService);
  private router = inject(Router);

  operation = signal<Operation | undefined>(undefined);
  loading   = signal(true);
  error     = signal<string | null>(null);

  ngOnInit(): void {
    this.opsService.getOperationById(this.id).subscribe({
      next: op => {
        this.operation.set(op);
        this.loading.set(false);
        if (!op) this.error.set(`Operation with ID "${this.id}" was not found.`);
      },
      error: () => {
        this.error.set('Failed to load operation details.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/operations']);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'status--completed', FAILED: 'status--failed',
      PENDING: 'status--pending',     PROCESSING: 'status--processing'
    };
    return map[status] ?? '';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      HIGH: 'priority--high', MEDIUM: 'priority--medium', LOW: 'priority--low'
    };
    return map[priority] ?? '';
  }
}
