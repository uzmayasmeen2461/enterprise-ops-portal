import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { OperationsService } from '../../core/services/operations.service';
import { AuthService } from '../../core/auth/auth.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { RoleAccessDirective } from '../../shared/directives/role-access.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    StatCardComponent,
    // RoleAccessDirective — structural directive; imported exactly like a component
    RoleAccessDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private opsService = inject(OperationsService);
  authService = inject(AuthService);

  // Reading service signals directly — no local copy needed
  // When the service signal updates, this component's template updates automatically
  loading    = this.opsService.loading;
  error      = this.opsService.error;
  stats      = this.opsService.stats;
  operations = this.opsService.operations;

  // Local computed — recent failed operations for the activity feed
  recentFailed = computed(() =>
    this.operations()
      .filter(o => o.status === 'FAILED')
      .slice(0, 5)
  );

  // The stat card config — driven by computed stats signal
  // Using a getter so it re-evaluates when stats() changes
  get statCards() {
    const s = this.stats();
    return [
      { title: 'Total Operations', count: s.total,       icon: 'layers',        color: 'primary' },
      { title: 'Completed',        count: s.completed,   icon: 'check_circle',  color: 'success' },
      { title: 'Pending',          count: s.pending,     icon: 'schedule',      color: 'warning' },
      { title: 'Failed',           count: s.failed,      icon: 'error',         color: 'danger'  },
      { title: 'Processing',       count: s.processing,  icon: 'sync',          color: 'info'    },
      { title: 'High Priority',    count: s.highPriority, icon: 'priority_high', color: 'purple'  }
    ];
  }

  // ngOnInit — Angular lifecycle hook, equivalent to React's useEffect(()=>{}, [])
  // Runs once after the component is initialised
  ngOnInit(): void {
    this.opsService.loadOperations().subscribe();
  }
}
