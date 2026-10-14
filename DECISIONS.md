# Design Decisions

> 🇮🇷 **A Persian (فارسی) version of this document is available in a separate file: [DECISIONS.fa.md](DECISIONS.fa.md).**

Running log of decisions made while planning. Each one should be demonstrable in the README.

## Product / lifecycle
| # | Decision | Why |
|---|---|---|
| D1 | Statuses: Open, In Progress, Answered, Closed. Any agent reply -> Answered. Client reply -> In Progress. Agent status change without reply (Open) -> In Progress. | Brief's lifecycle was ambiguous; "In Progress" = ball is with the agent, "Answered" = waiting on client. |
| D2 | **Only agents can close a ticket.** Clients cannot. Closed is final: no reopen, no replies. | Owner's call; keeps the transition table small. |
| D3 | Transitions live in one function `(status, event, role) -> newStatus or error`, used by every endpoint. | Single source of truth for the lifecycle; easy to unit test. |
| D4 | "Needs attention" is derived from status (Open, In Progress), no extra column. Highlighted in list + quick filter with count. | No extra state to keep in sync. |

## Users / auth
| # | Decision | Why |
|---|---|---|
| D5 | Signup fields: name, email, password, department. Signup always creates a Client; role never comes from the request. Agents are seeded. | Prevents privilege escalation. |
| D6 | Email + password login, JWT in an httpOnly cookie, short-lived. Server loads the user on each request. | Simple, secure enough; deleted/changed accounts take effect at once. |
| D7 | Department is chosen at signup (3 fixed values, listed in README) and copied onto the ticket at creation. Agents see all tickets and can filter by department. | Brief mentions department filter but defines no field. |
| D8 | Slug = slugified name + UUID. | Unique, no collision handling. |

## Architecture
| # | Decision | Why |
|---|---|---|
| D9 | **Polling (every 3-5 s) for ticket threads, not WebSockets.** State this at the top of the README. | Brief never asks for real-time. WebSockets only if everything else is done. |
| D10 | Middleware layers: `authenticate` -> `requireRole('agent')` -> ownership enforced in the query (`WHERE user_id = me`). | Server is the real guard; client route guards are UX only. |
| D11 | Foreign ticket returns 404 from the API; UI shows "Not Authorized" toast and redirects to `/tickets`. | Doesn't reveal that an ID exists. |
| D12 | Stack: Next.js 16 monolith (Route Handlers for the API), Bun runtime (`bun run --bun next ...`, `bunVersion` in `vercel.json`), HeroUI v3 + Tailwind v4, TanStack Query, zod, jose, `Bun.password`. Zustand only if a real need appears. | Owner's choice; one deployable app, fewest moving parts. |
| D13 | Database: Neon Postgres + Drizzle ORM. Two Neon branches: `production` and `dev`, each with its own connection strings in env vars. App uses the pooled URL; migrations use the direct URL. | Hostable demo; dev and prod data never mix. |
| D14 | The Next.js 16 `proxy.ts` (renamed from `middleware.ts`) only does the coarse check (no valid cookie -> redirect to `/login`). Role and ownership checks (D10) live in route handlers / data functions. | Proxy is a redirect layer, not the security boundary. |
| D15 | UI is Persian, RTL (`lang="fa" dir="rtl"`), Vazirmatn font, Jalali dates via `Intl` (`fa-IR-u-ca-persian`), Tailwind logical classes (`ms-`/`me-`/`text-start`), `dir="auto"` on user-written text, all UI strings in one file. | Brief is Persian; mixed Persian/English user text must render correctly. |
| D16 | Deployed demo on Vercel. | Owner's choice. |
| D17 | A `message` is one reply in a ticket's thread (author, body, timestamp). The ticket's `description` is shown as the first bubble. Messages drive status transitions (D1). | Keeps the thread simple. |
| D18 | Visual language: a calm product UI built only from HeroUI tokens in `globals.css`: one cobalt accent, cool neutrals, one radius rule (cards and fields 12-16 px, buttons and chips are pills), Phosphor icons only (one family, regular weight, filled for the active nav item). Motion is limited to a short fade-and-rise on page content and list rows, and is switched off for "reduce motion". | A support desk is used all day: quiet, consistent, no colour outside the tokens. |
| D19 | Light and dark themes. The default follows the operating system; a toggle saves the choice in `localStorage`. An inline script in `<head>` sets `class="dark"` on `<html>` before the first paint (no flash). Components use token utilities (`bg-surface`, `text-muted`, `border-border`), never fixed colours. | Dark mode works from day one instead of being bolted on. |
| D20 | App layout: sidebar on the start side (the right) on desktop, a top bar with a drawer on phones. Tickets are list rows, not tables (they reflow on phones). The ticket page is the thread plus a facts panel (the panel comes first on phones). Filters are status tabs with counts plus a search/priority/department toolbar; "needs attention" is a tab for agents. | Standard pattern for tools like this; every screen works at 375 px. |

## Routes
`/login`, `/signup`, `/tickets`, `/tickets/new`, `/tickets/{id}`, `/users` (agent only), `/users/{slug}`.
- `/tickets`: client sees own tickets (timestamps, status, priority). Agent sees all, default sort `updated_at` desc, filters: status, priority, department; one search box over title + author name; pagination.
- `/tickets/{id}`: thread + composer for both roles (disabled when Closed); agent additionally gets the status control.
- `/users`: agent only, clients with department and open-ticket count (every status except Closed), name search. Clients get a "Not Authorized" toast.
- `/users/{slug}`: owner or agent. Summary + tickets.
- Also: logout, `/` redirects to `/tickets`, 404 page, redirect to `/login` on expired token, `/users` link hidden from clients.
