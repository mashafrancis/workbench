import { CopyCommand } from "../components/copy-command";
import {
  ElysiaLogo,
  ExpressLogo,
  FastifyLogo,
  HonoLogo,
  HyperLogo,
  NestjsLogo,
  NextLogo,
} from "../components/logos";

const GITHUB_URL = "https://github.com/pontusab/workbench";
const INSTALL_COMMAND = "npx @getworkbench/cli init";

const frameworks = [
  { name: "Hono", Logo: HonoLogo },
  { name: "Elysia", Logo: ElysiaLogo },
  { name: "Express", Logo: ExpressLogo },
  { name: "Fastify", Logo: FastifyLogo },
  { name: "NestJS", Logo: NestjsLogo },
  { name: "Next.js", Logo: NextLogo },
  { name: "Hyper", Logo: HyperLogo },
];

export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-6 md:px-10 md:py-8">
      <nav className="flex items-center justify-between text-sm">
        <div className="font-mono lowercase tracking-tight text-[color:var(--color-foreground)]">
          workbench
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-muted-foreground)] transition hover:text-[color:var(--color-foreground)]"
        >
          Github
        </a>
      </nav>

      <section className="relative flex flex-1 flex-col items-center justify-center gap-10 py-16 text-center md:py-24">
        <div className="relative">
          <div className="hero-glow" aria-hidden />
          <h1 className="hero-headline mx-auto max-w-5xl text-balance text-5xl font-bold leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl">
            a <span className="hero-italic">beautiful</span>, open-source{" "}
            <span className="hero-fill">BullMQ</span> dashboard for modern Node
            apps.
          </h1>
        </div>

        <CopyCommand command={INSTALL_COMMAND} variant="inline" />

        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
            Featuring
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[color:var(--color-foreground)]">
            {frameworks.map(({ name, Logo }) => (
              <span key={name} className="inline-flex items-center gap-2">
                <Logo className="h-4 w-4" />
                <span className="text-sm">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
