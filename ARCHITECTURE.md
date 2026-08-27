# Architecture Deep-Dive

## The Mental Model

Think of the app in three layers:

```
┌─────────────────────────────────────────┐
│           FEATURE COMPONENTS            │  ← what the user sees
│   login / dashboard / operations /      │
│   exceptions / operation-detail         │
├─────────────────────────────────────────┤
│              SERVICE LAYER              │  ← where state lives
│   AuthService · OperationsService       │
│   MockAiSearchService · MockDataService │
├─────────────────────────────────────────┤
│          CROSS-CUTTING CONCERNS         │  ← runs across everything
│   authGuard · authInterceptor           │
│   StatusFormatPipe · Directives         │
└─────────────────────────────────────────┘
```

---

## State Management Strategy

### Why Signals for UI state, Observables for I/O

```
Signal  →  synchronous, reactive, in-memory value
            e.g. isLoggedIn, loading, currentUser, stats

Observable → asynchronous stream, usually from outside the app
            e.g. HTTP responses, debounced keystrokes, route events
```

| Scenario | Tool | Why |
|---|---|---|
| Is the user logged in? | `signal<boolean>` | Always in memory, synchronous, derived from |
| Dashboard stats | `computed()` | Automatically derived from operations signal |
| Load operations from API | `Observable` | Async, may cancel, may error |
| Debounce search input | `Observable + debounceTime` | Stream of events over time |
| Router events | `toSignal(router.events)` | Bridge: convert Observable → Signal for template |

### AuthService signal architecture

```
                  login() / logout()
                       │
                       ▼
          private _currentUser = signal<AuthUser | null>()
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      isLoggedIn    userRole    loggedInUser
      computed()   computed()   computed()
           │
     Components read
     (never write)
```

Components only ever read the public `computed()` signals.
They call `login()` / `logout()` methods to trigger changes.
This is the same pattern as a Redux store — the service owns state, components dispatch actions.

### OperationsService signal architecture

```
loadOperations() / searchOperations()
              │
              ▼ (Observable from mock/HTTP)
         tap() side effect
              │
              ▼
    private _operations = signal<Operation[]>()
              │
        ┌─────┴──────┐
        ▼             ▼
   operations      stats = computed()
   (readonly)      { total, failed, pending... }
        │
   Components subscribe
   data source updated
```

---

## Dependency Injection Architecture

### The provider tree

```
appConfig providers (root level)
    ├── AuthService           providedIn: 'root'
    ├── OperationsService     providedIn: 'root'
    ├── MockDataService       providedIn: 'root'
    ├── AI_SEARCH_SERVICE     → MockAiSearchService  (via InjectionToken)
    ├── Router
    ├── HttpClient            + authInterceptor
    └── ...Angular internals
```

Every component inherits from this tree. When a component calls `inject(AuthService)`,
Angular walks up the injector tree and returns the singleton already created at root level.

### Why InjectionToken for the AI service

```typescript
// Without InjectionToken — component is tightly coupled to the mock:
private ai = inject(MockAiSearchService);  // ❌ can't swap later

// With InjectionToken — component only knows the interface:
private ai = inject(AI_SEARCH_SERVICE);    // ✅ gets whatever is registered

// Swapping in app.config.ts:
{ provide: AI_SEARCH_SERVICE, useClass: RealOpenAiSearchService }  // one line change
```

---

## Routing Architecture

```
/                    → redirect → /dashboard
/login               → LoginComponent          (public)
/dashboard           → DashboardComponent      (guarded)
/operations          → OperationsComponent     (guarded)
/operations/:id      → OperationDetailComponent (guarded, input binding)
/exceptions          → ExceptionsComponent     (guarded)
**                   → redirect → /dashboard
```

All protected routes use `canActivate: [authGuard]`.
All feature components are loaded with `loadComponent()` — **lazy loaded**.
This means the browser only downloads the JS for a feature when the user first navigates to it.

```typescript
// This is lazy loading:
loadComponent: () =>
  import('./features/dashboard/dashboard.component')
    .then(m => m.DashboardComponent)
// Angular creates a separate JS chunk for this component.
// The browser downloads it on first navigation, not at app startup.
```

`withComponentInputBinding()` in the router config enables route params to be
injected directly as `@Input()` properties — no `ActivatedRoute` injection needed.

---

## HTTP Flow

```
Component calls OperationsService.loadOperations()
          │
          ▼
    HttpClient.get('/api/operations')       ← (mock: of([...]).pipe(delay(600)))
          │
    authInterceptor runs FIRST
          │  req.clone({ setHeaders: { Authorization: 'Bearer <token>' } })
          │
          ▼
    Response arrives as Observable
          │
    tap() sets _operations signal
          │
    Component template re-renders automatically
```

In production, replace `of(mockData).pipe(delay(600))` with
`this.http.get<Operation[]>('/api/operations')` — the rest of the chain is identical.

---

## Component Communication Patterns

| Direction | Mechanism | Example |
|---|---|---|
| Parent → Child | `@Input()` / `input()` | StatCardComponent receives title, count, icon |
| Child → Parent | `@Output()` / `output()` | AiSearchBarComponent emits filtersResolved |
| Any → Any | Shared service (singleton) | All components read AuthService.isLoggedIn |
| Sibling → Sibling | Shared service signal | (would use OperationsService signal) |

---

## The AI Search Data Flow

```
User types in AiSearchBarComponent
          │
    queryControl.valueChanges (Observable)
          │
    debounceTime(600ms)       ← ignores rapid typing
    distinctUntilChanged()    ← ignores duplicate values
    filter(q => q.length >= 3)
    switchMap(q => aiService.parseQuery(q))  ← cancels previous if user keeps typing
          │
    AiSearchResult { filters, interpretation, confidence }
          │
    output() emits → OperationsComponent.onAiResult()
          │
    searchForm.reset()
    searchForm.patchValue(result.filters)  ← only sets what AI found
    onSearch()
          │
    OperationsService.searchOperations(filters)
          │
    Table updates
```

---

## Testing Architecture

```
AuthService spec    →  pure unit test, no TestBed needed for core logic
                       Tests: signals, login/logout, localStorage, navigate()

Pipe spec           →  no TestBed, just new StatusFormatPipe() + transform()
                       Tests: string transformations, edge cases, null handling

Guard spec          →  TestBed.runInInjectionContext() to run functional guard
                       Tests: allowed/denied, UrlTree redirect

Component spec      →  full TestBed, real template, mock services
                       Tests: rendering, form validation, submission, signals
```

Each test file isolates exactly one unit. Dependencies are replaced with `vi.fn()` mock
functions — the test only verifies the unit's own behaviour, not its dependencies'.
