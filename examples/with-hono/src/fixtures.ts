/**
 * Shared fixtures: queue catalog, realistic job names, payload generators,
 * and an error catalog used by seed.ts, workers.ts, and index.ts.
 *
 * Hand-rolled generators (no faker dep) to keep the example lightweight.
 */

export const QUEUE_NAMES = [
  "email",
  "invoice",
  "webhooks",
  "reports",
  "image-processing",
  "notifications",
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

/** Approximate per-queue characteristics (ms / failure rate). */
export const QUEUE_PROFILES: Record<
  QueueName,
  {
    /** Median duration in ms. */
    medianMs: number;
    /** Max duration in ms for the long tail. */
    tailMs: number;
    /** 0-1 fraction of jobs that fail. */
    failRate: number;
    /** Median wait time (in queue) in ms. */
    medianWaitMs: number;
  }
> = {
  email: { medianMs: 220, tailMs: 1200, failRate: 0.02, medianWaitMs: 120 },
  invoice: { medianMs: 1500, tailMs: 8000, failRate: 0.015, medianWaitMs: 400 },
  webhooks: { medianMs: 420, tailMs: 30000, failRate: 0.08, medianWaitMs: 250 },
  reports: {
    medianMs: 12000,
    tailMs: 60000,
    failRate: 0.04,
    medianWaitMs: 600,
  },
  "image-processing": {
    medianMs: 1200,
    tailMs: 8000,
    failRate: 0.03,
    medianWaitMs: 180,
  },
  notifications: {
    medianMs: 80,
    tailMs: 500,
    failRate: 0.01,
    medianWaitMs: 60,
  },
};

export const JOB_NAMES: Record<QueueName, string[]> = {
  email: [
    "send-welcome",
    "send-receipt",
    "send-digest",
    "send-password-reset",
    "send-invite",
    "send-trial-ending",
    "send-invoice-paid",
  ],
  invoice: [
    "generate-pdf",
    "send-invoice",
    "mark-paid",
    "recurring-bill",
    "issue-credit-note",
  ],
  webhooks: [
    "stripe.charge.succeeded",
    "stripe.subscription.updated",
    "stripe.invoice.paid",
    "github.push",
    "github.pull_request",
    "slack.notify",
    "linear.issue.created",
    "zapier.trigger",
  ],
  reports: [
    "daily-revenue",
    "monthly-usage",
    "cohort-analysis",
    "export-customers",
    "export-transactions",
    "churn-report",
  ],
  "image-processing": [
    "resize-thumbnail",
    "compress-upload",
    "generate-og-image",
    "extract-exif",
    "blur-hash",
  ],
  notifications: [
    "push-mobile",
    "in-app-banner",
    "sms-alert",
    "web-push",
    "digest-summary",
  ],
};

/** Realistic errors per queue. */
export const ERRORS: Record<
  QueueName,
  Array<{ message: string; stack: string[] }>
> = {
  email: [
    {
      message: "SMTPTimeoutError: connection to smtp.mailgun.com:587 timed out",
      stack: [
        "at Socket.onTimeout (/app/node_modules/nodemailer/lib/smtp-connection/index.js:312:18)",
        "at Socket.emit (node:events:529:35)",
        "at Socket._onTimeout (node:net:596:8)",
      ],
    },
    {
      message: "Invalid recipient: recipient domain has no MX record",
      stack: [
        "at resolveMx (/app/src/mailer.ts:48:11)",
        "at async sendEmail (/app/src/mailer.ts:96:22)",
        "at async Worker.processJob (/app/src/workers/email.ts:14:5)",
      ],
    },
    {
      message: "Rate limit exceeded (429) for account smtp.postmark.com",
      stack: [
        "at PostmarkClient.sendEmail (/app/node_modules/postmark/dist/client.js:184:15)",
        "at async Worker.processJob (/app/src/workers/email.ts:14:5)",
      ],
    },
  ],
  invoice: [
    {
      message: "PDFGenerationError: wkhtmltopdf exited with code 1",
      stack: [
        "at ChildProcess.<anonymous> (/app/src/pdf/wkhtml.ts:72:19)",
        "at ChildProcess.emit (node:events:529:35)",
        "at Process.ChildProcess._handle.onexit (node:internal/child_process:294:12)",
      ],
    },
    {
      message: "Stripe API error: charge_failed (code: card_declined)",
      stack: [
        "at Stripe.charges.create (/app/node_modules/stripe/lib/resource.js:401:14)",
        "at async markPaid (/app/src/billing/stripe.ts:118:7)",
      ],
    },
    {
      message: "Tax service unavailable: taxjar.com returned 503",
      stack: [
        "at TaxJarClient.quote (/app/src/billing/tax.ts:38:11)",
        "at async generateInvoice (/app/src/billing/invoice.ts:92:23)",
      ],
    },
  ],
  webhooks: [
    {
      message: "HTTP 502 Bad Gateway from https://hooks.slack.com/services/T…",
      stack: [
        "at fetch (/app/src/http/client.ts:44:11)",
        "at async deliver (/app/src/webhooks/deliver.ts:81:16)",
      ],
    },
    {
      message: "ETIMEDOUT connecting to api.stripe.com:443",
      stack: [
        "at Socket.onTimeout (/app/src/http/client.ts:62:11)",
        "at async retryWithBackoff (/app/src/http/retry.ts:28:19)",
      ],
    },
    {
      message: "Circuit breaker open for hooks.zapier.com (12 recent failures)",
      stack: [
        "at CircuitBreaker.exec (/app/src/http/circuit.ts:58:13)",
        "at async deliver (/app/src/webhooks/deliver.ts:74:9)",
      ],
    },
    {
      message: "Invalid signature: HMAC mismatch for payload hash",
      stack: [
        "at verifySignature (/app/src/webhooks/sign.ts:31:11)",
        "at deliver (/app/src/webhooks/deliver.ts:56:5)",
      ],
    },
  ],
  reports: [
    {
      message: "OutOfMemoryError: query returned 2.1M rows (limit 500k)",
      stack: [
        "at ReportBuilder.fetchAll (/app/src/reports/builder.ts:142:15)",
        "at async runReport (/app/src/reports/run.ts:31:18)",
      ],
    },
    {
      message: "Warehouse connection reset by peer (snowflake)",
      stack: [
        "at SnowflakeClient.query (/app/src/warehouse/snowflake.ts:88:15)",
        "at async runReport (/app/src/reports/run.ts:31:18)",
      ],
    },
  ],
  "image-processing": [
    {
      message:
        "Sharp: VIPS error — corrupt JPEG data, premature end of segment",
      stack: [
        "at Sharp.toBuffer (/app/node_modules/sharp/lib/output.js:88:11)",
        "at async resize (/app/src/images/resize.ts:22:19)",
      ],
    },
    {
      message: "Unsupported source type: video/mp4 (expected image/*)",
      stack: [
        "at validateType (/app/src/images/validate.ts:14:11)",
        "at async resize (/app/src/images/resize.ts:12:5)",
      ],
    },
  ],
  notifications: [
    {
      message: "APNs rejected token: BadDeviceToken",
      stack: [
        "at APNsProvider.send (/app/src/push/apns.ts:61:11)",
        "at async dispatch (/app/src/push/dispatch.ts:24:7)",
      ],
    },
    {
      message: "FCM: SenderIdMismatch — project credentials rotated",
      stack: [
        "at FCMProvider.send (/app/src/push/fcm.ts:48:11)",
        "at async dispatch (/app/src/push/dispatch.ts:24:7)",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Payload generators — lightweight, deterministic-ish where it matters.
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Ava",
  "Liam",
  "Noah",
  "Emma",
  "Olivia",
  "Sofia",
  "Mateo",
  "Zara",
  "Kai",
  "Isla",
  "Theo",
  "Mila",
  "Jude",
  "Freya",
  "Hugo",
  "Nora",
  "Ezra",
  "Lara",
];
const LAST_NAMES = [
  "Nguyen",
  "Patel",
  "García",
  "Kowalski",
  "Sørensen",
  "Okafor",
  "Tanaka",
  "Müller",
  "Rossi",
  "Kim",
  "Bergström",
  "Fischer",
  "Costa",
  "Haddad",
];
const DOMAINS = [
  "acme.co",
  "initech.io",
  "globex.com",
  "hooli.xyz",
  "pied-piper.dev",
  "stark.industries",
  "wayne.enterprises",
  "umbrella.corp",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

function randomEmail(): string {
  const first = pick(FIRST_NAMES).toLowerCase();
  const last = pick(LAST_NAMES)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const domain = pick(DOMAINS);
  return `${first}.${last}@${domain}`;
}

function randomAmount(min = 9, max = 9999): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomUrl(host: string): string {
  return `https://${host}/${Math.random().toString(36).slice(2, 8)}`;
}

function recentIso(withinMs: number): string {
  return new Date(
    Date.now() - Math.floor(Math.random() * withinMs),
  ).toISOString();
}

export const PAYLOAD: Record<
  QueueName,
  (jobName: string) => Record<string, unknown>
> = {
  email: (name) => ({
    to: randomEmail(),
    from: "no-reply@getworkbench.dev",
    template: name.replace(/^send-/, ""),
    subject:
      name === "send-receipt"
        ? `Receipt from ${pick(DOMAINS)}`
        : name === "send-welcome"
          ? "Welcome to Workbench"
          : name === "send-digest"
            ? "Your weekly digest"
            : "Action required",
    locale: pick(["en", "sv", "de", "fr", "es"]),
    userId: randomId("usr"),
  }),
  invoice: (name) => ({
    invoiceId: randomId("inv"),
    customerId: randomId("cus"),
    amount: randomAmount(49, 9999),
    currency: pick(["USD", "EUR", "GBP", "SEK"]),
    dueAt: recentIso(-14 * 24 * 60 * 60 * 1000),
    lineItems: Math.floor(1 + Math.random() * 12),
    action: name,
  }),
  webhooks: (name) => ({
    event: name,
    deliveryId: randomId("whd"),
    endpoint: randomUrl(
      pick([
        "hooks.slack.com",
        "api.stripe.com",
        "api.github.com",
        "hooks.zapier.com",
      ]),
    ),
    attempt: 1 + Math.floor(Math.random() * 3),
    size: Math.floor(256 + Math.random() * 8192),
  }),
  reports: (name) => ({
    reportId: randomId("rep"),
    type: name,
    range: {
      from: recentIso(30 * 24 * 60 * 60 * 1000),
      to: new Date().toISOString(),
    },
    requestedBy: randomEmail(),
    format: pick(["csv", "xlsx", "pdf"]),
  }),
  "image-processing": (name) => ({
    assetId: randomId("asst"),
    action: name,
    src: randomUrl("cdn.getworkbench.dev"),
    targetWidth: pick([64, 128, 256, 512, 1024, 2048]),
    quality: pick([70, 80, 85, 90]),
  }),
  notifications: (name) => ({
    channel: name.startsWith("push")
      ? "apns"
      : name.startsWith("web")
        ? "web-push"
        : name.startsWith("sms")
          ? "twilio"
          : "in-app",
    recipientId: randomId("usr"),
    title: pick([
      "New message",
      "Payment received",
      "Deploy finished",
      "Mention in #general",
    ]),
    body: pick([
      "You have a new reply.",
      "Your report is ready to download.",
      "3 new issues triaged.",
      "Build #1243 finished in 2m 14s.",
    ]),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Time + distribution helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Business-hours-weighted score for a given hour (0-23) — higher = more load. */
export function hourWeight(hour: number): number {
  // Two bumps: 9am-12pm and 2pm-6pm. Quiet nights.
  const morning = Math.exp(-((hour - 10.5) ** 2) / 8);
  const afternoon = Math.exp(-((hour - 15.5) ** 2) / 10);
  return 0.15 + morning + afternoon;
}

/** Log-normal-ish sample: returns a value skewed toward `median` with `tail` max. */
export function sampleDuration(median: number, tail: number): number {
  const u = Math.random();
  if (u < 0.85) {
    return Math.round(median * (0.4 + Math.random() * 1.6));
  }
  return Math.round(median + Math.random() * (tail - median));
}

export { pick, pickN };
