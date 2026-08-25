export interface Shot {
  src: string;
  /** Intrinsic pixels. Required so next/image can reserve space and never shift. */
  w: number;
  h: number;
  /** Alt text. Describes what the screen does, not that it is a screenshot. */
  alt: string;
  /** Shown under the image in the lightbox. Optional. */
  caption?: string;
}

/**
 * Product screenshots, per project.
 *
 * These 22 files have been committed to public/images/projects/ and shown to
 * nobody. The live site gates its gallery on `projects.meta.gallery`, a JSONB
 * column that was never populated, and there is no media manager in the admin
 * to populate it — audit finding M-16.
 *
 * So this map is deliberate scaffolding, not the design. The right fix is
 * media management in the Desk, at which point this file is deleted and the
 * data comes from `meta.gallery` through `getProtoSnapshot()`, which currently
 * drops the field entirely. Until then a typed map beats an empty gallery.
 *
 * Dimensions were read from the PNG headers, not guessed.
 */
export const GALLERIES: Record<string, Shot[]> = {
  khataflow: [
    {
      src: "/images/projects/khataflow/01-dashboard.png",
      w: 2880,
      h: 1800,
      alt: "KhataFlow dashboard showing cash position and receivables ageing",
      caption: "Reports are derived from the ledger, so they cannot drift from the books.",
    },
    {
      src: "/images/projects/khataflow/02-invoices.png",
      w: 2880,
      h: 1800,
      alt: "Invoice list with multi-currency totals",
      caption: "Every invoice carries the rate it was issued at, frozen permanently.",
    },
    {
      src: "/images/projects/khataflow/03-invoice-editor.png",
      w: 2880,
      h: 1800,
      alt: "Invoice editor with per-line tax and live totals",
      caption: "Per-line tax, live totals, and named number series.",
    },
    {
      src: "/images/projects/khataflow/04-reports.png",
      w: 2880,
      h: 1800,
      alt: "Profit and loss report with period comparatives",
      caption: "Exports are never gated on a plan — a business's books belong to the business.",
    },
  ],

  stencil: [
    {
      src: "/images/projects/stencil/01-queue.png",
      w: 3120,
      h: 1880,
      alt: "Extraction queue showing documents and their processing state",
      caption: "The first invoice from a new layout costs a model call. Every one after is free.",
    },
    {
      src: "/images/projects/stencil/02-suppliers.png",
      w: 3120,
      h: 1880,
      alt: "Supplier list with per-supplier extraction rules",
      caption: "Adding a supplier is data, not code: a profile in JSON, no bespoke Python.",
    },
    {
      src: "/images/projects/stencil/03-reconciliation.png",
      w: 3120,
      h: 1880,
      alt: "Reconciliation view matching extracted lines against expected values",
      caption: "Deterministic replay means the same PDF twice gives the same rows.",
    },
    {
      src: "/images/projects/stencil/04-insights.png",
      w: 3120,
      h: 1880,
      alt: "Spend insights derived from extracted invoice data",
      caption: "",
    },
  ],

  signal: [
    {
      src: "/images/projects/signal/01-today.png",
      w: 2880,
      h: 1880,
      alt: "Today view listing the roles worth attention",
      caption: "A short list every morning, from a single process with no broker.",
    },
    {
      src: "/images/projects/signal/02-roles.png",
      w: 2880,
      h: 1880,
      alt: "Role definitions used for scoring",
      caption: "Location fit is scored separately from role fit, so a job you cannot take never tops the list.",
    },
    {
      src: "/images/projects/signal/03-intros.png",
      w: 2880,
      h: 1880,
      alt: "Drafted introductions for surfaced roles",
      caption: "",
    },
    {
      src: "/images/projects/signal/04-activity.png",
      w: 2880,
      h: 1880,
      alt: "Activity log showing scheduler and worker health",
      caption: "Degraded services surface as a banner; the app never looks healthy while it is not.",
    },
  ],

  hotplate: [
    {
      src: "/images/projects/hotplate/site-home.png",
      w: 1440,
      h: 900,
      alt: "HotPlate marketing site home page",
      caption: "",
    },
    {
      src: "/images/projects/hotplate/site-meal-plans.png",
      w: 1440,
      h: 900,
      alt: "Meal plan listing on the public site",
      caption: "",
    },
    {
      src: "/images/projects/hotplate/site-packages.png",
      w: 1440,
      h: 900,
      alt: "Package and pricing options",
      caption: "",
    },
    {
      src: "/images/projects/hotplate/site-quote.png",
      w: 1440,
      h: 900,
      alt: "Quotation request flow",
      caption: "Structured data is generated from the same constants that render the page.",
    },
    {
      src: "/images/projects/hotplate/01-quotation.png",
      w: 1190,
      h: 1683,
      alt: "Generated quotation document",
      caption: "Proforma invoices are modelled as their own document, because that is what secures a booking.",
    },
    {
      src: "/images/projects/hotplate/03-long-menu.png",
      w: 1190,
      h: 1683,
      alt: "Multi-page menu document",
      caption: "",
    },
  ],

  raqam: [
    {
      src: "/images/projects/raqam/01-dashboard.png",
      w: 1280,
      h: 2856,
      alt: "Raqam dashboard showing spend by category",
      caption: "Every figure traces back to the alert it came from.",
    },
    {
      src: "/images/projects/raqam/02-transactions.png",
      w: 1280,
      h: 2856,
      alt: "Transaction list parsed from bank SMS alerts",
      caption: "There is no open banking in Pakistan, so Raqam reads the alerts.",
    },
    {
      src: "/images/projects/raqam/03-review.png",
      w: 1280,
      h: 2856,
      alt: "Review queue for transactions the parser was unsure about",
      caption: "Uncertainty is routed to a review queue rather than guessed at.",
    },
    {
      src: "/images/projects/raqam/04-privacy.png",
      w: 1280,
      h: 2856,
      alt: "Privacy and permissions screen",
      caption: "Native build, because reading SMS and notifications needs one.",
    },
  ],
};
