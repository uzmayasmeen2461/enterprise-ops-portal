import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AI_SEARCH_SERVICE } from './core/services/ai-search.token';
import { RealAiSearchService } from './core/services/real-ai-search.service';
// import { MockAiSearchService } from './core/services/mock-ai-search.service';
// ↑ Swap the comment above to use the offline mock instead of the real API.
//   No other file needs to change.

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Router — withComponentInputBinding lets route params bind directly
    // to component @Input() properties (modern Angular pattern)
    provideRouter(routes, withComponentInputBinding()),

    // HTTP client with functional interceptor chain.
    // withInterceptors([...]) is the modern API (Angular 15+).
    // Interceptors run in the order they are listed.
    provideHttpClient(withInterceptors([authInterceptor])),

    // AI Search — swap useClass to switch between mock and real implementation.
    // The InjectionToken means no component or other service needs to change.
    {
      provide:  AI_SEARCH_SERVICE,
      useClass: RealAiSearchService
      // useClass: MockAiSearchService   ← uncomment to use offline mock
    }
  ]
};
