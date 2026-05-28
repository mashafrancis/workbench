import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Code,
  Command,
  Download,
  FlaskConical,
  Github,
  Heart,
  Network,
  TerminalSquare,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ActionButton } from "../components/action-button";
import { CompareTable } from "../components/blog/compare-table";
import { CopyCommand } from "../components/copy-command";
import {
  AdonisLogo,
  AstroLogo,
  BunLogo,
  DockerLogo,
  ElysiaLogo,
  ExpressLogo,
  FastifyLogo,
  H3Logo,
  HonoLogo,
  KoaLogo,
  NestjsLogo,
  NextLogo,
  NuxtLogo,
  TanstackStartLogo,
} from "../components/logos";
import {
  ErrorsMockup,
  FlowsMockup,
  OverviewMockup,
  RunsMockup,
  SchedulersMockup,
  TestMockup,
} from "../components/mockups";
import { ThemeToggle } from "../components/theme-toggle";
import { COMPARISON_ROWS } from "../lib/blog/comparison";

/** Update once the desktop app has a tagged GitHub Release. */
const MAC_DOWNLOAD_URL =
  "https://github.com/pontusab/workbench/releases/latest";
const GITHUB_URL = "https://github.com/pontusab/workbench";
const STANDALONE_DOCS_URL = `${GITHUB_URL}/tree/main/apps/standalone`;
const STANDALONE_IMAGE = "ghcr.io/pontusab/workbench-standalone:latest";
const DOCKER_RUN_COMMAND = `docker run --rm -p 3000:3000 \\
  -e REDIS_URL=redis://host.docker.internal:6379 \\
  -e QUEUE_NAMES=default \\
  ${STANDALONE_IMAGE}`;
const SPONSORS_URL = "https://github.com/sponsors/pontusab";
const TWITTER_URL = "https://x.com/pontusab";
const DOCS_URL = "https://github.com/pontusab/workbench#readme";
const COMPARISON_URL = "/blog/workbench-vs-bull-board";
const INSTALL_COMMAND = "npx @getworkbench/cli init";

/**
 * Each framework logo links straight to its `@getworkbench/<framework>` npm
 * page so the "works with" strip doubles as a per-framework install affordance
 * — npm gives visitors the install command, rendered README, and version, all
 * of which is what they're hunting for when they click a logo on a dashboard
 * landing page. Linking to GitHub would just drop everyone at the monorepo
 * root, and linking to the framework's own site would send them away from
 * Workbench entirely.
 *
 * Order is intentional: the most popular adapters lead the strip so the first
 * thing visible to a visitor (before the marquee rolls) is the framework they
 * already use. The marquee loops continuously so every adapter eventually
 * cycles into view regardless of starting position.
 */
const NPM_BASE = "https://www.npmjs.com/package/@getworkbench";
const npmAdapter = (slug: string) => ({
  href: `${NPM_BASE}/${slug}`,
  title: `Install @getworkbench/${slug}`,
});
const frameworks = [
  { name: "Hono", Logo: HonoLogo, ...npmAdapter("hono") },
  { name: "Elysia", Logo: ElysiaLogo, ...npmAdapter("elysia") },
  { name: "Express", Logo: ExpressLogo, ...npmAdapter("express") },
  { name: "Fastify", Logo: FastifyLogo, ...npmAdapter("fastify") },
  { name: "NestJS", Logo: NestjsLogo, ...npmAdapter("nestjs") },
  { name: "AdonisJS", Logo: AdonisLogo, ...npmAdapter("adonis") },
  { name: "Next.js", Logo: NextLogo, ...npmAdapter("next") },
  {
    name: "TanStack Start",
    Logo: TanstackStartLogo,
    ...npmAdapter("tanstack-start"),
  },
  { name: "Koa", Logo: KoaLogo, ...npmAdapter("koa") },
  { name: "Astro", Logo: AstroLogo, ...npmAdapter("astro") },
  { name: "Nuxt", Logo: NuxtLogo, ...npmAdapter("nuxt") },
  { name: "Bun", Logo: BunLogo, ...npmAdapter("bun") },
  { name: "h3", Logo: H3Logo, ...npmAdapter("h3") },
];

/** Deployment option — not an npm adapter; links to standalone docs. */
const dockerDeployment = {
  name: "Docker",
  Logo: DockerLogo,
  href: STANDALONE_DOCS_URL,
  title: "Run Workbench as a standalone Docker container",
};

/** Hero marquee shows framework adapters plus Docker. */
const heroStrip = [...frameworks, dockerDeployment];

/**
 * Homepage JSON-LD.
 *
 * `SoftwareApplication` (with `applicationCategory: DeveloperApplication`
 * and `offers.price: 0`) is the canonical way to tell both Google's Rich
 * Results pipeline and LLM-based search (ChatGPT, Perplexity, Claude) that
 * Workbench is a free developer tool — without it, those systems have to
 * infer it from prose and frequently get the pricing model wrong when
 * describing the project in an answer.
 *
 * The nested `ItemList` enumerates every framework with a first-party
 * adapter. Listing the npm package URL for each adapter gives AI systems a
 * structured signal that "Workbench supports framework X" is verifiable —
 * far stronger than the same claim sitting in prose, and what enables
 * citations of the form "Workbench is the BullMQ dashboard for [framework]"
 * for adapters that aren't the top organic result for that query.
 *
 * `@id` references back to the site-wide Organization node defined in the
 * root layout so we don't duplicate the brand definition.
 */
const SITE_URL = "https://getworkbench.dev";
const homepageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#workbench`,
      name: "Workbench",
      alternateName: "Workbench — the BullMQ dashboard",
      description:
        "A local-first, native desktop app to inspect, debug, and replay your BullMQ queues. Drop the same dashboard into any Node.js framework with one command.",
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Job queue dashboard",
      operatingSystem: "macOS, Node.js, Bun, Docker",
      softwareVersion: "latest",
      license: "https://opensource.org/licenses/MIT",
      downloadUrl: MAC_DOWNLOAD_URL,
      installUrl: GITHUB_URL,
      codeRepository: GITHUB_URL,
      programmingLanguage: ["TypeScript", "JavaScript"],
      featureList: [
        "Live counters, p50/p95 latency, and throughput per queue",
        "Virtualised runs table with status filters and keyboard retry",
        "FlowProducer DAG visualisation",
        "Scheduler timeline for cron and delayed jobs",
        "Error triage grouped by exception class with 24h trend lines",
        "Open failed-job stack traces in Cursor or VS Code with one click",
        "Native macOS desktop app, embeddable server dashboard, and standalone Docker image",
        "MCP server for Cursor, Claude Desktop, Zed, and Continue.dev",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Pontus Abrahamsson",
        url: "https://x.com/pontusab",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#supported-frameworks`,
      name: "Frameworks supported by Workbench",
      description:
        "First-party @getworkbench/* adapters with smoke-tested example apps.",
      numberOfItems: frameworks.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: frameworks.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: f.name,
        url: f.href,
      })),
    },
    {
      // Kept separate from #supported-frameworks because MCP isn't a
      // framework adapter — it's a different product axis (drive the
      // dashboard from an AI agent vs mount the dashboard in a server).
      // Folding it into the framework list would make Schema.org consumers
      // mis-categorise Cursor / Claude Desktop as "Node.js frameworks".
      "@type": "ItemList",
      "@id": `${SITE_URL}/#ai-integrations`,
      name: "AI agent integrations for Workbench",
      description:
        "MCP servers and AI tooling for driving Workbench from agents like Cursor, Claude Desktop, Zed, and Continue.dev.",
      numberOfItems: 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "@getworkbench/mcp — Model Context Protocol server",
          url: "https://www.npmjs.com/package/@getworkbench/mcp",
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#container-deployments`,
      name: "Container deployments for Workbench",
      description:
        "Standalone Docker image for running Workbench without embedding it in an app server.",
      numberOfItems: 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "workbench-standalone on GHCR",
          url: STANDALONE_DOCS_URL,
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <main className="relative isolate">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />

      <Nav />

      <Hero />

      <Section
        eyebrow="Overview"
        title="Every queue, every job — at a glance."
        body="Live counters, p50/p95 latency, throughput sparklines, and per-queue health without ever shelling into Redis. Built for the way modern apps actually run on BullMQ."
        align="left"
        mockup={<OverviewMockup />}
      />

      <Section
        eyebrow="Runs"
        title="Inspect every run. Replay any failure."
        body="A virtualized table with sharp status colors, real timestamps, and full job payloads one click away. Filter by status, search by ID, retry from the keyboard."
        align="right"
        mockup={<RunsMockup />}
      />

      <Section
        eyebrow="Flows"
        title="Visualize FlowProducer graphs."
        body="Parent/child relationships rendered as a real DAG with per-node status and duration. Drill into any node, replay subtrees, and see where time is going."
        align="left"
        mockup={<FlowsMockup />}
      />

      <Section
        eyebrow="Schedulers"
        title="Cron + delayed jobs you can actually trust."
        body="See which schedulers are active, when they last ran, and what's next. Pause, resume, and edit cron expressions without redeploying."
        align="right"
        mockup={<SchedulersMockup />}
      />

      <DualFeature />

      <BuiltForDevs />

      <ComparisonSection />

      <InstallSection />

      <Footer />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Nav                                                                        */
/* -------------------------------------------------------------------------- */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[color:var(--color-border)]/60 bg-[color:var(--color-background)]/70 px-6 py-3 backdrop-blur-md md:px-10">
      <a href="/" className="flex items-center gap-2">
        <Image
          src="/app-icon.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7"
          priority
        />
        <span className="font-mono text-sm lowercase tracking-tight">
          workbench
        </span>
      </a>
      <div className="flex items-center gap-5 text-sm text-[color:var(--color-muted-foreground)] md:gap-6">
        <a
          href="/blog"
          className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
        >
          Blog
        </a>
        <Link
          href={COMPARISON_URL}
          className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
        >
          vs Bull Board
        </Link>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
        >
          Docs
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
        >
          GitHub
        </a>
        <a
          href={SPONSORS_URL}
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-[color:var(--color-foreground)]"
        >
          Sponsor
        </a>
        <ThemeToggle />
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    // Bottom padding is *zero* on this section because the dashboard
    // screenshot bleeds straight into the section divider below — no air
    // gap, no drop shadow. The eye reads it as a real window into the app
    // that you can scroll past.
    <section className="relative overflow-hidden px-6 pt-16 md:px-10 md:pt-24">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <h1 className="hero-headline text-balance text-5xl sm:text-6xl md:text-[76px]">
          The missing dashboard for BullMQ.
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-[color:var(--color-muted-foreground)] md:text-lg">
          Inspect, debug, and replay your BullMQ queues. Run it as a native
          desktop app, drop it into any Node framework, or deploy it as a
          standalone Docker container.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <ActionButton
            href={MAC_DOWNLOAD_URL}
            label="Download for Mac"
            icon={<Download className="h-[18px] w-[18px]" strokeWidth={2.25} />}
            shortcut="D"
            variant="primary"
            external
          />
          <ActionButton
            href="#install"
            label="Install in your app"
            icon={
              <TerminalSquare
                className="h-[18px] w-[18px]"
                strokeWidth={2.25}
              />
            }
            shortcut="I"
            variant="secondary"
          />
        </div>

        <p className="mt-4 font-mono text-[11px] text-[color:var(--color-muted-foreground)]">
          macOS 11+ · Apple-signed · MIT
        </p>
      </div>

      <div className="relative mx-auto mt-14 max-w-6xl">
        <HeroFrameworks />
        <div className="hero-preview-glow" aria-hidden />
        <OverviewMockup bleed />
      </div>
    </section>
  );
}

/**
 * Compact "works with" strip that sits between the hero CTAs and the product
 * screenshot. Doubles as social proof and as a visual key to the framework
 * list referenced throughout the page, so we don't need a standalone band
 * lower down.
 *
 * The strip rolls continuously left-to-right via CSS transform. The trick to
 * a seamless loop is rendering the framework list twice in a row and animating
 * the track from `translateX(0)` to `translateX(-50%)` — at the loop point the
 * second copy is exactly where the first started, so the jump is invisible.
 *
 * Each item carries its inter-item spacing as `margin-right` (rather than a
 * flex `gap`) so the total layout width is a clean multiple of the per-item
 * pitch, which is what makes the `-50%` translate land pixel-perfect on the
 * second copy. With flex `gap` the boundary between the two copies skips one
 * gap and the loop visibly stutters.
 *
 * Edges fade out via a mask so logos enter and exit smoothly instead of
 * clipping at hard boundaries. Hover pauses the animation, and
 * `prefers-reduced-motion` halts it entirely. Duplicate items are marked
 * aria-hidden so screen readers only announce the framework list once.
 */
function HeroFrameworks() {
  return (
    <div
      className="hero-marquee mb-14 text-[color:var(--color-foreground)]"
      aria-label="Works with these frameworks and Docker"
    >
      <div className="hero-marquee-track">
        {heroStrip.map(({ name, Logo, href, title }) => (
          <a
            key={`primary-${name}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hero-marquee-item inline-flex items-center gap-1.5 opacity-70 transition hover:opacity-100"
            title={title}
          >
            <Logo className="h-4 w-4" />
            <span className="text-[12px] tracking-tight">{name}</span>
          </a>
        ))}
        {/* Visual duplicate so the loop is seamless. These are presentational
            only — screen readers announce the framework list once via the
            primary copy above, then ignore everything inside this group. */}
        {heroStrip.map(({ name, Logo }) => (
          <span
            key={`mirror-${name}`}
            className="hero-marquee-item inline-flex items-center gap-1.5 opacity-70"
            aria-hidden="true"
          >
            <Logo className="h-4 w-4" />
            <span className="text-[12px] tracking-tight">{name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Generic two-column feature section                                         */
/* -------------------------------------------------------------------------- */

interface SectionProps {
  eyebrow: string;
  title: string;
  body: string;
  mockup: React.ReactNode;
  align: "left" | "right";
}

function Section({ eyebrow, title, body, mockup, align }: SectionProps) {
  return (
    <section className="relative border-t border-[color:var(--color-border)]/60 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-12">
        <div
          className={`md:col-span-5 ${
            align === "right" ? "md:order-2 md:col-start-8" : ""
          }`}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            {eyebrow}
          </div>
          <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-[color:var(--color-muted-foreground)]">
            {body}
          </p>
        </div>
        <div
          className={`md:col-span-7 ${align === "right" ? "md:order-1" : ""}`}
        >
          <div className="relative">
            <div className="section-glow" aria-hidden />
            {mockup}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Dual feature row (Test + Errors)                                           */
/* -------------------------------------------------------------------------- */

function DualFeature() {
  return (
    <section className="border-t border-[color:var(--color-border)]/60 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            Test
          </div>
          <h3 className="text-2xl font-semibold tracking-tight">
            Enqueue jobs straight from the dashboard.
          </h3>
          <p className="text-[color:var(--color-muted-foreground)]">
            Compose a payload, pick a queue, hit ⌘↵. Validates against your
            schema and shows the run on the next render.
          </p>
          <TestMockup />
        </div>
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            Errors
          </div>
          <h3 className="text-2xl font-semibold tracking-tight">
            Triage failures, not log files.
          </h3>
          <p className="text-[color:var(--color-muted-foreground)]">
            Errors are grouped by class, ranked by frequency, and trended over
            time so you can spot regressions the moment they hit production.
          </p>
          <ErrorsMockup />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Built-for-devs feature grid                                                */
/* -------------------------------------------------------------------------- */

function BuiltForDevs() {
  const items = [
    {
      icon: BarChart3,
      title: "Live counters",
      body: "Completed, failed, active, waiting — per queue, updated as workers move jobs. p50/p95 latency and throughput tracked alongside.",
    },
    {
      icon: Activity,
      title: "Run inspector",
      body: "A virtualized table of every job. Filter by status, search by ID, expand the full payload and attempts history without leaving the row.",
    },
    {
      icon: AlertCircle,
      title: "Error triage",
      body: "Failures grouped by error class and ranked by frequency, with a 24h trend per class. See the regression the moment it spikes.",
    },
    {
      icon: Code,
      title: "Open in Cursor",
      body: "Click any line in a failed job's stack trace — Workbench jumps straight to that file in Cursor or VS Code. No copy-paste, no grep.",
    },
    {
      icon: Network,
      title: "FlowProducer DAG",
      body: "Parent/child flows rendered as a real graph with per-node status and duration. Drill into any node, replay subtrees, see where time is going.",
    },
    {
      icon: Clock,
      title: "Cron + delayed schedulers",
      body: "Which schedulers are active, when they last ran, what's next. Pause, resume, edit cron expressions — without a redeploy.",
    },
    {
      icon: FlaskConical,
      title: "Enqueue from the UI",
      body: "Compose a payload, pick a queue, hit ⌘↵. Validates against your schema and shows the run on the next render. Faster than `redis-cli`.",
    },
    {
      icon: Command,
      title: "Keyboard for everything",
      body: "⌘K to search, ⌥1–9 to switch queues, R to retry, ↵ to drill in. Every action you reach for has a binding — no menu hunting.",
    },
  ];

  return (
    <section className="border-t border-[color:var(--color-border)]/60 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            What's inside
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Everything a BullMQ dashboard should do.
          </h2>
          <p className="mt-3 text-[color:var(--color-muted-foreground)]">
            Metrics, runs, errors, flows, schedulers, and an enqueue form —
            wired together so the thing you need next is always one keystroke
            away.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[color:var(--color-border)]/80 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 bg-[color:var(--color-background)] p-6"
            >
              <Icon className="h-4 w-4 text-[color:var(--color-foreground)]" />
              <div className="text-sm font-medium tracking-tight">{title}</div>
              <p className="text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* bull-board comparison                                                      */
/* -------------------------------------------------------------------------- */

function ComparisonSection() {
  return (
    <section
      id="compare"
      className="scroll-mt-16 border-t border-[color:var(--color-border)]/60 px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            vs Bull Board
          </div>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            The modern bull-board alternative for BullMQ.
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-[color:var(--color-muted-foreground)]">
            Bull Board is the dashboard everyone already knows. Workbench covers
            the same Redis queues with thirteen first-party adapters, FlowProducer
            DAGs, error triage, and a keyboard-driven UI — plus a native macOS app
            and standalone Docker image.
          </p>
          <p className="mt-4">
            <Link
              href={COMPARISON_URL}
              className="text-sm font-medium text-[color:var(--color-foreground)] underline decoration-[color:var(--color-border)] underline-offset-4 transition hover:decoration-[color:var(--color-foreground)]"
            >
              Read the full comparison →
            </Link>
          </p>
        </div>

        <div className="mt-10">
          <CompareTable rows={COMPARISON_ROWS} compact />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Install / final CTA                                                        */
/* -------------------------------------------------------------------------- */

function InstallSection() {
  return (
    <section
      id="install"
      className="scroll-mt-16 border-t border-[color:var(--color-border)]/60 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            Install
          </div>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            One dashboard. Three ways to run it.
          </h2>
          <p className="mt-3 text-[color:var(--color-muted-foreground)]">
            Native macOS app for local debugging, one command to mount the
            dashboard inside your Node server, or a standalone Docker container
            pointed at your Redis. Same UI, same open-source core.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InstallCard
            eyebrow="Desktop"
            title="Native macOS app"
            body="Local-first. Auto-discovers queues from any Redis URL. Stores credentials in the OS keychain. Auto-updates via signed releases."
            action={
              <ActionButton
                href={MAC_DOWNLOAD_URL}
                label="Download for Mac"
                icon={
                  <Download className="h-[18px] w-[18px]" strokeWidth={2.25} />
                }
                variant="primary"
                external
              />
            }
          />

          <InstallCard
            eyebrow="Embed"
            title="Drop into your Node app"
            body="One command wires the dashboard into your existing server. Works with Hono, Elysia, Express, Fastify, NestJS, AdonisJS, Next.js, TanStack Start, Koa, Astro, Nuxt, Bun, and h3 — share the same Redis as your workers."
            action={<CopyCommand command={INSTALL_COMMAND} variant="button" />}
          />

          <InstallCard
            eyebrow="Docker"
            title="Standalone container"
            body="Run Workbench without embedding it in your app. Set REDIS_URL and QUEUE_NAMES — published to GHCR on every release tag."
            action={
              <CopyCommand command={DOCKER_RUN_COMMAND} variant="button" />
            }
          />
        </div>
      </div>
    </section>
  );
}

function InstallCard({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/30 p-6 md:p-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
        {eyebrow}
      </div>
      <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="text-[color:var(--color-muted-foreground)]">{body}</p>
      <div className="mt-auto">{action}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)]/60 px-6 pt-16 pb-10 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-xs text-[color:var(--color-muted-foreground)] md:flex-row">
        <div className="flex items-center gap-2 font-mono lowercase tracking-tight">
          <Image src="/app-icon.svg" alt="" width={18} height={18} />
          <span>workbench</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--color-foreground)]"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--color-foreground)]"
          >
            <Twitter className="h-3.5 w-3.5" />
            <span>@pontusab</span>
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-[color:var(--color-foreground)]"
          >
            Docs
          </a>
          <Link
            href={COMPARISON_URL}
            className="transition hover:text-[color:var(--color-foreground)]"
          >
            vs Bull Board
          </Link>
          <a
            href={SPONSORS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--color-foreground)]"
          >
            <Heart className="h-3.5 w-3.5 text-[#ff4d8a]/80" />
            <span>Sponsor</span>
          </a>
        </div>
      </div>

      {/* Oversized outlined wordmark — a quiet signature, not a heading.
          Bleeds past the footer's `px` so it stretches the full viewport
          width. 16vw is the sweet spot for 9 glyphs of GeistPixelLine
          (~0.67em wide each): the wordmark fills ~96% of any viewport
          without clipping the trailing characters. overflow-hidden acts as
          a safety net in case the font ever ships a slightly wider weight. */}
      <div
        aria-hidden
        className="-mx-6 mt-16 overflow-hidden leading-none md:-mx-10"
      >
        <span className="footer-wordmark block text-center text-[16vw]">
          workbench
        </span>
      </div>
    </footer>
  );
}
