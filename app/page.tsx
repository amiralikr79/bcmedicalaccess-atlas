import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { segments } from "@/lib/segments";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Top bar — quiet, editorial */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-3"
          aria-label="BC Clinic Atlas"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-2)]"
          >
            <Compass className="size-4 text-[var(--brass)] transition-transform duration-500 group-hover:rotate-45" />
          </span>
          <span className="font-display text-[15px] tracking-tight">BC Clinic Atlas</span>
        </Link>

        <div className="flex items-center gap-6">
          <span className="hidden font-mono text-[11px] tracking-[0.18em] text-[var(--ink-faint)] uppercase md:inline">
            v0.1 · alpha
          </span>
          <Link
            href="#preview"
            className="text-[13px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            Segments
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="glow-warm relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] px-6 pt-16 pb-24 md:px-12 md:pt-28 md:pb-40">
          <div className="max-w-[58ch]">
            <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
              British&nbsp;Columbia &nbsp;·&nbsp; Healthcare&nbsp;Atlas
            </p>

            <h1 className="font-display mt-8 text-[clamp(2.75rem,7.2vw,6.5rem)] leading-[0.95] font-normal tracking-[-0.025em] text-[var(--ink)]">
              Every clinic
              <br />
              in British Columbia.
              <br />
              <em className="font-display font-light text-[var(--ink-muted)] italic">Mapped.</em>
            </h1>

            <p className="mt-8 max-w-[42ch] text-[17px] leading-[1.55] text-[var(--ink-muted)] md:text-[19px]">
              A new way to find primary care, specialists, and clinics across the province —
              segmented, searchable, and quietly beautiful.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild size="lg" variant="primary">
                <Link href="/atlas">
                  Open the atlas
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>

              <span className="font-mono text-[11px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
                150 clinics · Metro Vancouver · Beta
              </span>
            </div>
          </div>
        </div>

        {/* hairline at base of hero */}
        <div className="hairline mx-auto w-full max-w-[1400px]" />
      </section>

      {/* Segment preview grid */}
      <section id="preview" className="relative">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-20 md:px-12 md:py-28">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
                Phase&nbsp;Plan
              </p>
              <h2 className="font-display mt-4 text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.05] font-normal tracking-[-0.02em] text-[var(--ink)]">
                Sixteen ways into <em className="font-light italic">health care</em>.
              </h2>
            </div>
            <p className="max-w-[40ch] text-[14px] leading-[1.6] text-[var(--ink-muted)]">
              We&rsquo;re shipping primary care first. The rest follow, one segment at a time — done
              well, never rushed.
            </p>
          </div>

          <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((seg, i) => {
              const phase = i === 0 ? "01 · MVP" : i < 4 ? "phase 2" : i < 8 ? "phase 3" : "later";
              const isMvp = i === 0;
              return (
                <li
                  key={seg.key}
                  className="group relative flex flex-col gap-3 bg-[var(--surface)] p-6 transition-colors duration-300 hover:bg-[var(--surface-2)]"
                >
                  <div className="flex items-start justify-between">
                    <span
                      aria-hidden
                      className="relative inline-flex size-3 items-center justify-center"
                    >
                      <span
                        className="absolute inset-0 rounded-full opacity-50 blur-[5px]"
                        style={{ background: `var(${seg.cssVar})` }}
                      />
                      <span
                        className="relative size-2.5 rounded-full ring-1 ring-black/40"
                        style={{ background: `var(${seg.cssVar})` }}
                      />
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--ink-faint)] uppercase">
                      {phase}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <span className="font-sans text-[15px] font-medium tracking-tight text-[var(--ink)]">
                      {seg.label}
                    </span>
                    <span className="text-[12.5px] leading-[1.5] text-[var(--ink-muted)]">
                      {seg.blurb}
                    </span>
                  </div>
                  {isMvp ? (
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-[var(--brass)] uppercase">
                      <span className="size-1 rounded-full bg-[var(--brass)]" /> shipping now
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12">
        <div className="hairline" />
      </div>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12 md:py-14">
        <div className="flex flex-col gap-6 text-[12.5px] text-[var(--ink-muted)] md:flex-row md:items-center md:justify-between">
          <p className="font-display text-[14px] text-[var(--ink-muted)] italic">
            Made with intention, not algorithms.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
            <span>© 2026 · BC Clinic Atlas</span>
            <span aria-hidden>·</span>
            <span>Open data</span>
            <span aria-hidden>·</span>
            <span>MapLibre</span>
            <span aria-hidden>·</span>
            <span>Supabase</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
