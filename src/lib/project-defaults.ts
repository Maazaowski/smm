import type { ProjectInput } from "./project-types";

/**
 * The five projects, seeded on first admin visit. Bodies are MDX and are meant
 * to be edited in /admin afterwards — this file is the starting draft, not the
 * source of truth once the table exists.
 */

const SIGNAL_BODY = `## The problem

Job boards are a firehose. A senior backend search returns thousands of listings a week, most of
them wrong on stack, wrong on seniority, or closed to you for reasons the posting never mentions.
Reading that yourself is hours a week of low-value work — and the real cost is that the one good
listing is buried at position four hundred, long after you stopped looking.

Signal does the reading. Every morning it pulls from public job boards and directly from company
boards, scores each role against a profile you control, works out whether it is actually open to
someone in your country, and emails you the handful worth a look.

## What it does

**Collects.** Public boards, plus direct crawls of company career pages. Roughly a hundred
employers ship in a curated list, and a discovery pass works out which of them publish a
crawlable board.

**Scores.** Every role gets a 0–100 match on title, tech overlap, seniority and domain signals,
weighted by a profile you edit in the app. Location fit is worked out separately and deliberately,
so a role you cannot legally take never reaches the top of the list no matter how well it matches
on everything else.

**Writes.** For the roles that survive, it drafts an intro built from your bio and the tech you and
the job have in common, capped to LinkedIn's 300-character connection note, and pairs it with a
search for the person to send it to.

**Runs itself.** One command starts the whole thing — no queue broker, no separate worker, no cron
entry. Jobs survive a page refresh, report live progress, and record what they did.

## Honest about itself

Every run keeps its logs, its statistics and its failure reason, and degraded services surface as a
banner. That matters more than it sounds for a tool whose entire job happens while you are asleep:
a collector that quietly returns nothing looks exactly like a quiet week unless the app says
otherwise.

Schedule, timezone, credentials and crawl behaviour are all edited in the app and take effect
immediately — no file editing, no restart.
`;

const RAQAM_BODY = `## The problem

Personal finance apps in Pakistan face a problem the Western ones designed around years ago: there
is no open banking. No aggregator API, no OAuth flow to your bank, no standard export. What there
*is* is the SMS your bank sends when money moves, and the notification the wallet app fires when it
does.

Raqam is an Android-first personal finance app built around that reality — and around the fact
that reading someone's message inbox is a serious thing to do, not a feature to ship casually.

## What it does

It reads money alerts and turns them into transactions with **source evidence attached** — every
record can point back at the exact alert it came from. Nothing is inferred and then presented as
fact.

Where the parser is unsure, it does not guess. Uncertainty is routed into a **review queue** where
you confirm or correct it, and the correction is what gets stored. Unconfirmed activity is held out
of the headline totals until you have decided on it, so the number on the dashboard is always one
you agreed to.

That is the difference between a finance app you keep using and one you quietly abandon: a
confident wrong number is a much worse failure than "this one needs you".

## Built for the permissions it asks for

Reading alerts means asking for unusual access, so the permission centre and the privacy screen are
first-class parts of the app rather than buried settings. The app stays fully usable with every
ingestion permission denied.

Dashboard, accounts, transactions, review queue, import centre, permission centre and settings are
all built, with a seeded demo mode that runs the same logic as the real thing rather than a
parallel fake. This one is still in progress — the parser coverage for Pakistani banks and wallets
is where the remaining work is.
`;

const KHATAFLOW_BODY = `## The problem

Businesses that work across borders get paid in one currency and keep their books in another. Every
off-the-shelf tool makes you choose one.

KhataFlow does both properly. An invoice raised in **USD stays USD** for the customer. Your books
stay in your base currency, converted at the rate on the day you issued it — and that rate is
frozen onto the invoice permanently. When the payment lands three weeks later at a different rate,
the difference is posted to foreign-exchange gain or loss automatically, because underneath it is a
real double-entry ledger rather than a spreadsheet with a nice front end.

Base currency is set per business from 48 supported currencies. It defaults to PKR, but nothing in
the product assumes it, and one login can hold several businesses on different base currencies at
once.

## What it does

**Invoicing** — multi-currency invoices with per-line tax, live totals as you type, three PDF
templates, public payment links, email delivery from your own domain, and named number series.

**Bookkeeping** — a real double-entry ledger, a chart of accounts with parent/child hierarchy,
manual journals, entry reversal and reclassification, period locks, year-end close, and expenses
with receipt uploads.

**Banking** — statement import from CSV, OFX and QFX, duplicate detection, and a reconciliation
session that tracks what has been matched.

**Reports** — profit and loss, balance sheet, cash flow, trial balance, general ledger, receivables
and payables ageing, income by customer, tax summary, period comparatives, CSV export and an
accountant pack. Exports are never gated on a plan; a business's books belong to the business.

**Also** — estimates, bills and accounts payable, credit and debit notes, vendors, recurring
invoices and bills, configurable payment reminders, team roles with per-action permissions, and
payroll.

## Built to be migrated into

Bringing years of history across from another system is the step that decides whether accounting
software actually gets adopted. So the importer refuses what it cannot read instead of guessing, a
bad row fails on its own with a reason rather than taking the batch down with it, and a whole run
can be undone as one batch.

The migration screen then checks the result the way an accountant would, rather than declaring
success as soon as the numbers tie.
`;

const STENCIL_BODY = `## The problem

Invoice extraction usually gets solved twice, badly. Either you build a template per supplier by
hand — brittle, and every new supplier means a developer — or you send every invoice to a language
model and pay for it forever.

Stencil takes a third path, borrowed from compilers: **AI is the model author, not the model
runner.** The first invoice of a new layout costs a model call, which produces a reusable
extraction model. Every invoice after that runs against that saved model at no cost.

## What it does

A PDF arrives and gets fingerprinted by its layout — no AI, just geometry. If the layout is
already known, the saved model handles it and the invoice costs nothing. If it is new, the AI path
reads it once and writes a model for it, which then handles everything that follows.

Two properties come out of that split, and they are the reason it is built this way:

**Cost is paid once per layout, not once per document.** Onboarding a supplier is the expensive
step. After that, volume is free.

**The output is reproducible.** The same invoice run twice produces the same rows, because the
second run is executing saved rules rather than asking a model to read a page again. For anything
feeding an accounting system, that is worth more than raw accuracy on a single pass.

Adding a supplier is a configuration change, not a code change — which means the person who knows
the supplier can do it, and there is no per-supplier code to maintain.

## Around the pipeline

There is a work queue showing everything moving through the system with its status and any
variance, supplier profiles with their saved models, a deterministic reconciliation step that
verifies the maths with no model involved, and an insights view showing how much of the volume ran
without an AI call at all.

A visual builder lets someone construct a model by hand against a sample document, for the layouts
where it is faster to point at the answer than to explain it.

## The stack

Python and FastAPI on the backend with a task queue for the pipeline, MySQL for state, and pymupdf
doing the layout work. Extraction runs against a large language model with structured outputs. The
front end is Next.js and React with a live pipeline view over a WebSocket.
`;

const HOTPLATE_BODY = `## The problem

HotPlate has been feeding Karachi since 2008 — takeaway from a shop in Soldier Bazaar, and catering
for weddings, corporate events and large functions with a two-hundred-guest minimum. Seventeen
years of that business ran on phone calls, WhatsApp and paper.

The quote is where it hurts. A catering quote is not a price list: it is a package, times a guest
count, plus per-head adjustments, minus whatever was negotiated — and then it has to become a
proforma invoice, then an invoice, then a payment record, and someone has to remember which of
those has actually happened. That works right up until two events land in the same week.

## What was built

A public site and an admin back office on the same application.

The public side carries packages, meal plans, a gallery, an FAQ, contact details with a map, and a
quote request form — which is the only page that really matters commercially, since everything else
exists to get someone to it.

The admin side is where the business runs: menu and packages with subcategories and pricing units,
quotes, **proforma invoices**, invoices, payments, reporting views, media and social proof, and
review requests.

## Quote to payment, in one place

A quotation is generated as a branded PDF on the business's own letterhead — itemised menu,
per-head pricing, totals, what is included, and terms — and emailed from the business's own domain.
From there it moves through proforma to invoice to payment as one tracked flow instead of a
WhatsApp thread and a paper file.

Proforma invoices are treated as their own document rather than a draft invoice, because in
catering the proforma is what secures the booking and takes the deposit, often weeks before
anything is delivered and sometimes for an event that then changes size.

## Getting found

For a local caterer, the review count *is* the marketing, so review requests are built in and wired
to the business's Google listing. The structured data search engines read is generated from the
same source as the contact details on the page, so the two cannot drift apart.
`;

/** The initial state of the "New Project" form. */
export const EMPTY_PROJECT: ProjectInput = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  body: "",
  category: "Web Development",
  status: "active",
  kind: "product",
  year: String(new Date().getFullYear()),
  client: "",
  repoOwner: null,
  repoName: null,
  featured: false,
  draft: false,
  sortOrder: 0,
  meta: { stack: [], outcomes: [], links: [], gallery: [] },
};

export const DEFAULT_PROJECTS: ProjectInput[] = [
  {
    slug: "khataflow",
    title: "KhataFlow",
    summary:
      "Invoicing and bookkeeping on a real double-entry ledger, for businesses that bill across currencies.",
    description:
      "An invoice raised in USD stays USD for the customer while your books stay in your base currency, with the FX rate frozen onto the invoice and the difference posted to foreign-exchange gain or loss automatically. Multi-business, multi-currency, on a real ledger.",
    body: KHATAFLOW_BODY,
    category: "Architecture",
    status: "active",
    kind: "client",
    year: "2026",
    client: "",
    repoOwner: "Maazaowski",
    repoName: "KhataFlow",
    featured: true,
    draft: false,
    sortOrder: 10,
    meta: {
      stack: [
        "TypeScript",
        "Next.js",
        "NestJS",
        "PostgreSQL",
        "Prisma",
        "Better Auth",
        "Turborepo",
      ],
      outcomes: [
        "Multi-currency invoicing with rates snapshotted per transaction and automatic realised FX gain/loss",
        "48 currencies, per-business base currency, with historical rates preserved on every document",
        "Reports derived from the ledger itself, so they cannot drift from the books",
      ],
      links: [],
      gallery: [
          {
            src: "/images/projects/khataflow/01-dashboard.png",
            alt:
              "KhataFlow dashboard showing income, expenses and net profit for the month, cash by account, and cash-flow and profit-and-loss charts",
            width: 2880,
            height: 1800,
          },
          {
            src: "/images/projects/khataflow/02-invoices.png",
            alt:
              "Invoice list with invoices in several currencies and paid, partial, overdue and sent states",
            width: 2880,
            height: 1800,
          },
          {
            src: "/images/projects/khataflow/03-invoice-editor.png",
            alt:
              "Invoice editor with line items and a live preview of the rendered invoice beside it",
            width: 2880,
            height: 1800,
          },
          {
            src: "/images/projects/khataflow/04-reports.png",
            alt:
              "Reports page showing profit and loss, expenses by category and outstanding receivables",
            width: 2880,
            height: 1800,
          },
        ],
    },
  },
  {
    slug: "stencil",
    title: "Stencil",
    summary:
      "Invoice extraction where AI authors the rules once and a deterministic interpreter replays them for free.",
    description:
      "A compiler-style pipeline for document extraction. The first invoice of a new layout costs a model call, which produces a declarative extraction model; every invoice after that is executed by a generic interpreter with no API calls and reproducible output.",
    body: STENCIL_BODY,
    category: "AI Engineering",
    status: "active",
    kind: "product",
    year: "2026",
    client: "",
    repoOwner: "Maazaowski",
    repoName: "Stencil",
    featured: true,
    draft: false,
    sortOrder: 20,
    meta: {
      stack: [
        "Python",
        "FastAPI",
        "Celery",
        "Redis",
        "MySQL",
        "pymupdf",
        "Next.js",
        "TanStack Query",
      ],
      outcomes: [
        "Per-invoice model cost drops to zero once a supplier layout is known",
        "Deterministic, reproducible extraction — the same PDF twice gives the same rows",
        "Adding a supplier is data, not code: profile JSON, no supplier-specific Python",
      ],
      links: [],
      gallery: [
          {
            src: "/images/projects/stencil/01-queue.png",
            alt:
              "The work queue: every invoice flowing through the pipeline with its status, reconciliation variance and page count",
            width: 3120,
            height: 1880,
          },
          {
            src: "/images/projects/stencil/02-suppliers.png",
            alt:
              "Supplier profiles list, showing which layouts have a saved extraction model",
            width: 3120,
            height: 1880,
          },
          {
            src: "/images/projects/stencil/03-reconciliation.png",
            alt:
              "Reconciliation view checking extracted totals against the invoice",
            width: 3120,
            height: 1880,
          },
          {
            src: "/images/projects/stencil/04-insights.png",
            alt:
              "Insights showing throughput and how much of the volume ran without an AI call",
            width: 3120,
            height: 1880,
          },
        ],
    },
  },
  {
    slug: "signal",
    title: "Signal",
    summary: "Your job search, minus the searching.",
    description:
      "Signal watches the boards so you don't have to. It collects roles overnight, scores them against a profile you control, drafts an intro for the ones worth your time, and emails you a short list every morning — from a single process with no broker and no database server.",
    body: SIGNAL_BODY,
    category: "AI Engineering",
    status: "active",
    kind: "product",
    year: "2026",
    client: "",
    repoOwner: "Maazaowski",
    repoName: "Signal",
    featured: true,
    draft: false,
    sortOrder: 30,
    meta: {
      stack: ["Python", "FastAPI", "SQLite", "httpx", "BeautifulSoup", "APScheduler"],
      outcomes: [
        "Location fit scored separately from role fit, so a job you can't take never tops the list",
        "One command starts API, scheduler and worker — no broker, no database server, no cron",
        "Degraded services surface as a banner; the app never looks healthy while it isn't",
      ],
      links: [],
      gallery: [
          {
            src: "/images/projects/signal/01-today.png",
            alt:
              "The Today page: a daily shortlist of roles with match scores and location fit",
            width: 2880,
            height: 1880,
          },
          {
            src: "/images/projects/signal/02-roles.png",
            alt:
              "Every collected listing, scored and filterable, with detail in a side panel",
            width: 2880,
            height: 1880,
          },
          {
            src: "/images/projects/signal/03-intros.png",
            alt:
              "The intros queue: a drafted message per role, ready to copy and send",
            width: 2880,
            height: 1880,
          },
          {
            src: "/images/projects/signal/04-activity.png",
            alt:
              "Activity view with run history, live progress, streaming logs and service health",
            width: 2880,
            height: 1880,
          },
        ],
    },
  },
  {
    slug: "hotplate",
    title: "HotPlate",
    summary:
      "Taking a seventeen-year-old Karachi catering business off paper — quotes, proformas, invoices and payments.",
    description:
      "A public site and an admin back office for a takeaway and catering business trading since 2008. Fifteen migrations of real domain: menu and packages, quotes, proforma invoices, payments, reporting views and Google review requests.",
    body: HOTPLATE_BODY,
    category: "Web Development",
    status: "active",
    kind: "client",
    year: "2026",
    client: "HotPlate — Takeaway and Caterers",
    repoOwner: "Maazaowski",
    repoName: "HotPlatePk",
    featured: false,
    draft: false,
    sortOrder: 40,
    meta: {
      stack: [
        "TypeScript",
        "Next.js",
        "Supabase",
        "PostgreSQL",
        "React PDF",
        "Resend",
        "Playwright",
      ],
      outcomes: [
        "Quote → proforma → invoice → payment as one tracked flow instead of WhatsApp and paper",
        "Proforma invoices modelled as their own document, because that is what secures a booking",
        "Structured data generated from the same constants that render the contact page, so they cannot drift",
      ],
      links: [{ label: "hotplatepk.com", href: "https://hotplatepk.com" }],
      gallery: [
          {
            src: "/images/projects/hotplate/site-home.png",
            alt:
              "The HotPlate home page: a full-bleed hero for a Karachi catering business, with the quote request as the primary call to action",
            width: 1440,
            height: 900,
          },
          {
            src: "/images/projects/hotplate/site-packages.png",
            alt:
              "Catering packages compared side by side, each with per-head pricing and the dishes included in every course",
            width: 1440,
            height: 900,
          },
          {
            src: "/images/projects/hotplate/site-quote.png",
            alt:
              "The build-your-own-menu quote tool: pick dishes course by course, set a guest count, and get a price straight away",
            width: 1440,
            height: 900,
          },
          {
            src: "/images/projects/hotplate/site-meal-plans.png",
            alt:
              "Daily meal plans for offices, priced per head",
            width: 1440,
            height: 900,
          },
          {
            src: "/images/projects/hotplate/01-quotation.png",
            alt:
              "A generated quotation: itemised menu, per-head pricing, totals and terms on the business letterhead",
            width: 1190,
            height: 1683,
          },
          {
            src: "/images/projects/hotplate/03-long-menu.png",
            alt:
              "A longer quotation, showing how the document reflows when a menu runs to many sections",
            width: 1190,
            height: 1683,
          },
        ],
    },
  },
  {
    slug: "raqam",
    title: "Raqam",
    summary:
      "Personal finance for Pakistan, built on the only data source that exists: the bank's SMS.",
    description:
      "Android-first personal finance with policy-conscious ingestion. There is no open banking in Pakistan, so Raqam reads money alerts, attaches source evidence to every record, and routes anything uncertain into a review queue rather than guessing.",
    body: RAQAM_BODY,
    category: "Web Development",
    status: "wip",
    kind: "product",
    year: "2026",
    client: "",
    repoOwner: "Maazaowski",
    repoName: "Raqam",
    featured: false,
    draft: false,
    sortOrder: 50,
    meta: {
      stack: [
        "TypeScript",
        "React Native",
        "Expo",
        "Supabase",
        "PostgreSQL",
        "Jest",
        "Detox",
      ],
      outcomes: [
        "Every transaction points back at the alert it came from — nothing inferred is shown as fact",
        "Parser uncertainty routed to a review queue instead of a confident wrong number",
        "Expo development build with native modules, because real SMS and notification access needs them",
      ],
      links: [],
      gallery: [
          {
            src: "/images/projects/raqam/01-dashboard.png",
            alt:
              "Raqam home screen showing a confirmed net position with unconfirmed activity held out of the totals until reviewed",
            width: 1280,
            height: 2856,
          },
          {
            src: "/images/projects/raqam/02-transactions.png",
            alt:
              "Transaction list with each entry tagged by the source it was derived from",
            width: 1280,
            height: 2856,
          },
          {
            src: "/images/projects/raqam/03-review.png",
            alt:
              "The review queue, where anything the parser was unsure about waits for a decision",
            width: 1280,
            height: 2856,
          },
          {
            src: "/images/projects/raqam/04-privacy.png",
            alt:
              "The privacy screen, showing what data the app holds and the controls over it",
            width: 1280,
            height: 2856,
          },
        ],
    },
  },
];
