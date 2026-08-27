// Development environment configuration.
// Referenced in services as: inject(ENVIRONMENT).apiBaseUrl
//
// In production, angular.json fileReplacements swaps this file with
// environment.prod.ts at build time — the service code never changes.
//
// React equivalent: process.env.REACT_APP_API_URL
// Angular equivalent: environment.apiBaseUrl (resolved at build time)
export const environment = {
  production: false,
  // Points to the local Express gateway during development.
  // The API key lives on that server — never in this file.
  apiBaseUrl: 'http://localhost:4000'
};
