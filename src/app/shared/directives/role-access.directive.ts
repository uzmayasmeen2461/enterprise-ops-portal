import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

// Structural directive — conditionally adds or removes elements from the DOM
// based on the logged-in user's role.
//
// This is Angular's *ngIf equivalent but driven by role rather than a boolean.
// Under the hood Angular desugars structural directives:
//   <button *appRoleAccess="'ADMIN'">Delete</button>
// becomes:
//   <ng-template [appRoleAccess]="'ADMIN'"><button>Delete</button></ng-template>
//
// React equivalent: { user.role === 'ADMIN' && <button>Delete</button> }
//
// NOTE: structural directive microsyntax desugars to a plain @Input() binding,
// so we use the classic @Input() here rather than the signal-based input().
// The signal-based input() works for attribute/property bindings on components
// and attribute directives but NOT as the primary structural binding.
//
// Usage:
//   <button *appRoleAccess="'ADMIN'">Admin Action</button>
//   <p *appRoleAccess="'VIEWER'">Read-only notice</p>

@Directive({
  selector: '[appRoleAccess]',
  standalone: true
})
export class RoleAccessDirective implements OnInit {

  // The required role to show the host element.
  // Must match the selector name exactly for the * microsyntax to work.
  @Input() appRoleAccess!: 'ADMIN' | 'VIEWER';

  private authService = inject(AuthService);

  // TemplateRef  — a reference to the <ng-template> the directive is attached to.
  // ViewContainerRef — the placeholder in the DOM where we can insert/remove views.
  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnInit(): void {
    const userRole = this.authService.userRole();

    if (userRole === this.appRoleAccess) {
      // createEmbeddedView inserts the template into the DOM
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      // clear() removes any previously inserted view
      this.viewContainer.clear();
    }
  }
}
