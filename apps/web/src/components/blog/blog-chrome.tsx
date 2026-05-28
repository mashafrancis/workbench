import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "../theme-toggle";

interface BlogChromeProps {
  children: ReactNode;
}

const GITHUB_URL = "https://github.com/pontusab/workbench";
const SPONSORS_URL = "https://github.com/sponsors/pontusab";
const COMPARISON_URL = "/blog/workbench-vs-bull-board";

/**
 * Shared header + footer used by both the blog index and individual post
 * pages. Same visual language as the marketing site but with a slimmer nav
 * and a "Back to Workbench" affordance so visitors who land on a post from
 * Google can find the product page in one click.
 */
export function BlogChrome({ children }: BlogChromeProps) {
  return (
    <main className="relative isolate min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[color:var(--color-border)]/60 bg-[color:var(--color-background)]/70 px-6 py-3 backdrop-blur-md md:px-10">
        <Link href="/" className="flex items-center gap-2">
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
          <span className="font-mono text-sm text-[color:var(--color-muted-foreground)]">
            / blog
          </span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-[color:var(--color-muted-foreground)] md:gap-6">
          <Link
            href="/"
            className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
          >
            Product
          </Link>
          <Link
            href="/blog"
            className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
          >
            Blog
          </Link>
          <Link
            href={COMPARISON_URL}
            className="hidden transition hover:text-[color:var(--color-foreground)] md:inline"
          >
            vs Bull Board
          </Link>
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

      {children}

      <footer className="border-t border-[color:var(--color-border)]/60 px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-xs text-[color:var(--color-muted-foreground)]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--color-foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workbench</span>
          </Link>
          <span className="font-mono lowercase">workbench · mit licensed</span>
        </div>
      </footer>
    </main>
  );
}
