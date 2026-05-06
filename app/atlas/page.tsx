import { Suspense } from "react";
import type { Metadata } from "next";

import { AtlasShell } from "@/components/map/AtlasShell";

export const metadata: Metadata = {
  title: "Atlas — BC Clinic Atlas",
  description: "Every clinic in British Columbia, mapped. Metro Vancouver, beta.",
};

export default function AtlasPage() {
  return (
    <Suspense fallback={<AtlasFallback />}>
      <AtlasShell />
    </Suspense>
  );
}

function AtlasFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
        loading atlas…
      </span>
    </div>
  );
}
