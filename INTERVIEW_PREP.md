# Interview Preparation Guide

This file maps every Angular concept in the project to likely interview questions,
with short reference answers. Study the code first — these are reminders, not scripts.

---

## 1. Standalone Components

**Q: What are standalone components and why does Angular have them?**

Before Angular 14, every component had to be declared inside an `NgModule`.
NgModules added boilerplate and made it hard to understand what a component depended on.
Standalone components declare their own dependencies in the `imports` array directly —
no module needed. They're now the default in modern Angular.

**Q: How does a standalone component declare its dependencies?**

In the `@Component` decorator's `imports` array. If the component uses `MatButtonModule`
and `RouterLink`, both go in `imports`. Angular resolves them at compile time.

---

## 2. Angular Signals

**Q: What is a Signal? How does it differ from a BehaviorSubject?**

A Signal is a reactive primitive that holds a value and notifies Angular's change detection
when it changes. Unlike a BehaviorSubject it doesn't need `.subscribe()`, `.pipe()`,
`async` pipe, or manual cleanup. You read it by calling it as a function: `signal()`.

| | Signal | BehaviorSubject |
|---|---|---|
| Read | `value()` | `.value` or `.subscribe()` |
| Write | `value.set(x)` | `.next(x)` |
| Derive | `computed(() => ...)` | `.pipe(map(...))` |
| Cleanup | automatic | must `unsubscribe()` |

**Q: When would you use an Observable instead of a Signal?**

Observable for async I/O — HTTP calls, debounced input streams, route events.
Signal for synchronous in-memory state — loading flags, current user, UI toggles.
The two work together: `toSignal()` converts an Observable to a Signal.

**Q: What does `computed()` do?**

Creates a derived signal that re-evaluates automatically when its dependencies change.
It's lazy and memoized — only recalculates when a dependency actually changes.
Equivalent to `useMemo` in React.

---

## 3. Dependency Injection

**Q: How does `inject()` work in Angular 22?**

`inject()` reads from Angular's current injection context — set by the framework before
calling your constructor, factory, or functional guard. It's an alternative to constructor
injection. You cannot call it outside an injection context (same rule as React hooks).

**Q: What is an InjectionToken and when do you use one?**

A runtime token for injecting an interface or primitive. Interfaces don't exist at runtime
so you can't use them as DI tokens. You create a typed token:
```typescript
const MY_TOKEN = new InjectionToken<MyInterface>('label');
```
Then provide it: `{ provide: MY_TOKEN, useClass: ConcreteImpl }`
And inject it: `inject(MY_TOKEN)`

**Q: What's the difference between `useClass`, `useValue`, `useFactory`, `useExisting`?**

| | Use case |
|---|---|
| `useClass` | "Create a new instance of this class when asked" |
| `useValue` | "Return this exact object/primitive when asked" |
| `useFactory` | "Call this function to create the value (can use deps)" |
| `useExisting` | "Alias this token to another already-registered token" |

---

## 4. Reactive Forms

**Q: What's the difference between Template-driven and Reactive Forms?**

Template-driven forms use `ngModel` in the template — Angular creates the form model for you.
Reactive Forms define the form model in the component class (FormGroup, FormControl) —
the template just binds to it. Reactive Forms are easier to test, more predictable,
and better for complex validation logic.

**Q: What is `patchValue()` vs `setValue()`?**

`patchValue()` updates only the fields you provide — ignores missing fields.
`setValue()` requires all fields — throws if any are missing.
Use `patchValue()` when you have partial data (e.g. AI search results).

**Q: How do you access a form control's validation errors in a template?**

```typescript
// In component
get username() { return this.form.get('username')!; }
```
```html
<!-- In template -->
@if (username.errors?.['required'] && username.touched) {
  <span>Required</span>
}
```

---

## 5. HTTP Interceptors

**Q: What is a functional HTTP interceptor?**

A plain function with signature `(req: HttpRequest, next: HttpHandlerFn) => Observable<HttpEvent>`.
It runs for every `HttpClient` request. You clone the request to add headers (requests are immutable),
then call `next(modifiedReq)` to pass it down the chain.

**Q: Why must you clone the request instead of mutating it?**

`HttpRequest` is intentionally immutable. Angular enforces this so interceptors can't
accidentally affect each other. `req.clone({ setHeaders: {...} })` returns a new request
with the headers merged.

**Q: How do you register a functional interceptor?**

In `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([myInterceptor]))
```

---

## 6. Route Guards

**Q: How does a functional route guard work?**

It's a `CanActivateFn` — a function that returns `true`, `false`, or a `UrlTree`.
`true` allows navigation, `false` blocks it, `UrlTree` redirects.
Angular calls it before activating the route. `inject()` works inside it.

**Q: Why return a UrlTree instead of calling `router.navigate()` inside the guard?**

Returning a `UrlTree` lets Angular manage the redirect as part of its navigation cycle —
it's cleaner, avoids race conditions, and doesn't create a second navigation event.
`router.navigate()` inside a guard would fire a new navigation on top of the blocked one.

---

## 7. Directives

**Q: What's the difference between an attribute directive and a structural directive?**

Attribute directive — modifies the appearance or behaviour of an existing element.
Applied as `<div appHighlight>`. Uses `ElementRef` to access the DOM.

Structural directive — adds or removes elements from the DOM.
Applied with `*` prefix: `<div *appRoleAccess="'ADMIN'">`.
Uses `TemplateRef` and `ViewContainerRef`.

**Q: What does the `*` syntax desugar to?**

```html
<button *appRoleAccess="'ADMIN'">Click</button>
<!-- becomes: -->
<ng-template [appRoleAccess]="'ADMIN'">
  <button>Click</button>
</ng-template>
```

**Q: Why does `*appRoleAccess` need `@Input()` not `input()`?**

The microsyntax desugars to a property binding `[appRoleAccess]="..."` which goes through
Angular's legacy input-binding path — not the signal-based `input()` API path.
Signal inputs don't register in the legacy binding resolution used by structural directive desugaring.

---

## 8. Lazy Loading

**Q: How does lazy loading work in Angular?**

Each route using `loadComponent()` creates a separate JS bundle (chunk).
The browser downloads that chunk only when the user first navigates to that route.
This reduces the initial bundle size and speeds up app startup.

**Q: What is `withComponentInputBinding()`?**

A router feature that lets route parameters, query params, and data be automatically
bound to `@Input()` properties on the routed component. Without it, you'd need to
inject `ActivatedRoute` and manually subscribe to `paramMap`.

---

## 9. RxJS Operators — The Ones You Actually Used

**Q: When do you use `switchMap` vs `mergeMap` vs `concatMap`?**

| Operator | Behaviour | Use case |
|---|---|---|
| `switchMap` | Cancels previous, starts new | Search-as-you-type, latest-wins |
| `mergeMap` | Runs all concurrently | Parallel HTTP requests |
| `concatMap` | Queues, runs one at a time | Sequential operations, preserving order |

**Q: What is the `takeUntil` pattern and why use it?**

An Observable that completes when another Observable emits.
Used with a `Subject` that emits in `ngOnDestroy` to auto-cancel all subscriptions:
```typescript
private destroy$ = new Subject<void>();

someObs$.pipe(takeUntil(this.destroy$)).subscribe(...);

ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
```
Prevents memory leaks from subscriptions that outlive the component.

---

## 10. Testing

**Q: What is `TestBed`?**

Angular's test utility that bootstraps a mini Angular environment.
It creates a module, compiles components, and manages the injector for tests.

**Q: What is `TestBed.runInInjectionContext()`?**

Sets up Angular's injection context so `inject()` calls work inside a function
that isn't a class constructor — essential for testing functional guards.

**Q: What does `fixture.detectChanges()` do?**

Triggers Angular's change detection cycle — equivalent to the first render.
Without it, the template is not populated. You call it manually in tests
because TestBed doesn't run change detection automatically.

---

## Quick-Fire Answers (common 2-minute interview questions)

| Q | A |
|---|---|
| What's `ngOnInit` vs constructor? | Constructor for DI setup; ngOnInit for business logic after Angular initialises inputs |
| What's `ViewChild`? | Gets a reference to a child component or DOM element after the view renders |
| What's `async` pipe? | Subscribes to an Observable in the template and auto-unsubscribes on destroy |
| What is change detection? | Angular's process of checking whether component state has changed and updating the DOM |
| What is `OnPush`? | Change detection strategy that only checks a component when its inputs change or a signal/observable emits |
| What's a pure pipe? | Only re-runs `transform()` when the input reference changes — result is cached |
| What's `providedIn: 'root'`? | Creates a singleton service available app-wide without importing any module |
