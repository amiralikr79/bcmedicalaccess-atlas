import type { Metadata } from "next";

import { AtlasShell } from "@/components/map/AtlasShell";

export const metadata: Metadata = {
  title: "Atlas — BC Clinic Atlas",
  description: "Every clinic in British Columbia, mapped. Metro Vancouver, beta.",
};

export default function AtlasPage() {
  return <AtlasShell />;
}
