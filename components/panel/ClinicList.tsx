"use client";

import { motion } from "framer-motion";

import { ClinicCard } from "./ClinicCard";
import type { DecoratedClinic } from "@/lib/filter-clinics";

interface ClinicListProps {
  clinics: readonly DecoratedClinic[];
  onHover: (slug: string | null) => void;
  onSelect: (c: DecoratedClinic) => void;
}

export function ClinicList({ clinics, onHover, onSelect }: ClinicListProps) {
  return (
    <motion.ul
      className="flex flex-col gap-1 px-3 py-2"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.025 } },
      }}
    >
      {clinics.map((c) => (
        <motion.li
          key={c.id}
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
          }}
        >
          <ClinicCard clinic={c} onHover={onHover} onSelect={onSelect} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
