# 2-Minute Management Demo Script

Use this when presenting to managers, stakeholders, or non-technical audiences.
Keep it to 2 minutes. Move fast. Let the UI speak.

---

## Opening (15 seconds)

> "This is a proof-of-concept I built to evaluate Angular as a framework for enterprise
> operations tooling. It simulates the kind of portal an ops team would use to monitor
> automated batch operations — processing requests from multiple source systems feeding in.
> Let me show you the key flows."

---

## Login (20 seconds)

*Navigate to http://localhost:4200 — it should redirect to /login*

> "The app requires authentication. I'll log in as an admin user."

*Type `admin` / `admin123` and submit.*

> "The form validates in real time — required fields, minimum length.
> The session persists across page refresh. Route guards prevent unauthenticated access."

---

## Dashboard (25 seconds)

*You're now on /dashboard*

> "The dashboard gives an at-a-glance view — total operations, completed, pending,
> failed, high priority. These numbers are live, driven by the same data as the table.
>
> Notice the 'Manage Exceptions' button — that's role-based. If I log in as a viewer,
> that button won't exist in the DOM at all, not just hidden."

---

## Operations Table (30 seconds)

*Click Operations in the sidebar*

> "The operations table shows all 50 records — sortable by any column, paginated.
> The AI search bar at the top is the interesting piece. I can type plain English:"

*Type: `show failed high priority operations`*

> "It parses the query, populates the filter form automatically, and runs the search.
> The green bar confirms what the AI understood. You can see the form dropdowns updated.
>
> For manual filtering, the standard form is here too — status, priority, source system,
> date range."

*Click any row*

---

## Operation Detail (15 seconds)

> "Clicking a row navigates to the detail view — core info, value details, timeline.
> For failed operations you get the error details and retry count."

*Click Back*

---

## Exceptions (15 seconds)

*Click Exceptions in the sidebar*

> "The exceptions page is a focused view — only FAILED operations, so ops teams
> don't have to filter manually. The count badge tells you immediately how many
> need attention. Hover over a row — that highlight is a custom Angular directive."

---

## Close (15 seconds)

> "Under the hood this uses Angular 22 — standalone components, the new Signals API,
> lazy loading so the browser only downloads what the user actually navigates to,
> and a proper test suite. The AI search is wired to a mock right now but the service
> abstraction means connecting a real LLM is a one-line change.
>
> Happy to go deeper on any piece of it."

---

## If They Ask "Could This Go to Production?"

> "The architecture is production-ready — the patterns, folder structure, and
> component design are what you'd see in a real enterprise Angular codebase.
> What's mock right now is the data layer and the AI service — both are behind
> service abstractions designed to swap in real API calls. That's intentional."
