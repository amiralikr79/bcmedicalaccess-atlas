import type { ReactNode } from "react";

export default function AtlasLayout({ children }: { children: ReactNode }) {
  // Full-bleed shell — overrides the marketing page's max-width container.
  return <div className="fixed inset-0 flex flex-col bg-[var(--bg)]">{children}</div>;
}
