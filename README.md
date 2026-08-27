# Enterprise Operations & Exception Management Portal

A production-realistic Angular POC demonstrating modern Angular architecture patterns applied to an enterprise operations and exception management system.

Built as a hands-on learning project to gain practical Angular experience with interview-ready depth across all core framework concepts.

---

## Live Demo

```bash
git clone <repo-url>
cd enterprise-ops-portal
npm install
ng serve
```

Open **http://localhost:4200**

| Username | Password | Role |
|----------|----------|------|
| `admin`  | `admin123`  | ADMIN  |
| `viewer` | `viewer123` | VIEWER |

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | Reactive Forms login with validation, mock JWT, route guards, localStorage session persistence |
| **Dashboard** | Real-time stat cards driven by Angular Signals and `computed()` |
| **Operations Table** | Sortable, paginated, filterable Angular Material table with search form |
| **Operation Detail** | Route parameter binding via `@Input()`, lazy-loaded component |
| **Exceptions Page** | Filtered view of FAILED operations with role-based access |
| **AI Search** | Natural language query → structured filters via service abstraction |
| **Role-Based UI** | Structural directive hides/shows DOM elements by user role |
| **HTTP Interceptor** | Attaches `Authorization: Bearer` token to all outgoing requests |

---

## Technology Stack

- **Angular 22** — standalone components, signals, functional guards and interceptors
- **TypeScript** — strict mode throughout
- **Angular Material** — tables, forms, navigation, cards
- **RxJS** — Observables, operators, subscription management
- **Vitest** — unit test suite

---

## Architecture

```
src/app/
├── core/
│   ├── auth/           # AuthService — singleton, signal-based state
│   ├── guards/         # authGuard — functional CanActivateFn
│   ├── interceptors/   # authInterceptor — functional HttpInterceptorFn
│   └── services/       # OperationsService, MockDataService, AI services
│
├── shared/
│   ├── components/     # StatCardComponent, AiSearchBarComponent
│   ├── directives/     # HighlightDirective, RoleAccessDirective
│   ├── pipes/          # StatusFormatPipe
│   └── models/         # Operation, DashboardStats, OperationSearchFilters
│
└── features/
    ├── login/          # Reactive Form, validation, auth flow
    ├── dashboard/      # Signals, computed(), stat cards
    ├── operations/     # Table, search form, AI search integration
    │   └── operation-detail/   # Route params, lazy loading
    └── exceptions/     # FAILED filter, role directive, highlight directive
```

**Key architectural decisions:**

- **Signals over BehaviorSubject** for synchronous UI state — simpler, no subscription management
- **Observables for async I/O** — HTTP calls, debounced inputs, event streams
- **InjectionToken for AI service** — decouples the interface from the implementation; swap mock → real LLM in one line
- **Functional guards/interceptors** — no class boilerplate, `inject()` available directly
- **Lazy-loaded routes** — each feature chunk loaded on demand, not at startup

---

## Angular Concepts Demonstrated

| Concept | Where |
|---|---|
| Standalone components | Every component |
| Signal (`signal()`) | AuthService, OperationsService, all components |
| `computed()` | OperationsService stats, DashboardComponent, OperationsComponent |
| `effect()` | Not used — intentionally avoided where `computed()` suffices |
| Reactive Forms + `FormBuilder` | LoginComponent, OperationsComponent, ExceptionsComponent |
| Custom validators | LoginComponent (minLength, required) |
| `FormGroup.patchValue()` | AI search → form bridge in OperationsComponent |
| `HttpClient` | OperationsService (ready for real API) |
| Functional HTTP interceptor | `authInterceptor` — Bearer token injection |
| Functional route guard | `authGuard` — CanActivateFn |
| Lazy loading | All feature routes via `loadComponent()` |
| `InjectionToken` | AI_SEARCH_SERVICE — interface-based DI |
| `@Input()` / `input()` | StatCardComponent, OperationDetailComponent |
| `output()` / `@Output()` | AiSearchBarComponent |
| Attribute directive | `HighlightDirective` — hover effect via `@HostListener` |
| Structural directive | `RoleAccessDirective` — DOM insertion/removal by role |
| Custom pipe (pure) | `StatusFormatPipe` |
| `switchMap` | AI search debounce stream |
| `debounceTime` + `distinctUntilChanged` | AI search input |
| `takeUntil` pattern | All subscriptions — clean unsubscription on destroy |
| Lifecycle hooks | `OnInit`, `OnDestroy`, `AfterViewInit` |
| `ViewChild` | MatPaginator, MatSort in table components |
| `MatTableDataSource` | Operations and Exceptions tables |
| `withComponentInputBinding()` | Route params as `@Input()` on detail components |
| `toSignal()` | Router events → Signal in AppComponent |

---

## Running Tests

```bash
ng test --watch=false
```

**Test coverage:**

| File | Type | Tests |
|---|---|---|
| `auth.service.spec.ts` | Service unit test | 10 tests |
| `status-format.pipe.spec.ts` | Pipe unit test | 12 tests |
| `auth.guard.spec.ts` | Guard unit test | 3 tests |
| `login.component.spec.ts` | Component + form test | 15 tests |
| `app.spec.ts` | Root component smoke test | 2 tests |

---

## Project Structure Notes

The `core/` folder holds singletons and cross-cutting concerns — nothing in `core/` is tied to a specific feature.
The `shared/` folder holds reusable UI building blocks that any feature can import.
The `features/` folder is where business logic lives — each subfolder is self-contained.

This is a standard enterprise Angular folder structure. In a larger app each feature folder would become a lazy-loaded route module (or a standalone route group).
