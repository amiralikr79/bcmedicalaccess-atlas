export type SegmentKey =
  | "primary_care"
  | "diagnostic"
  | "specialist"
  | "dental"
  | "vision"
  | "mental_health"
  | "allied_health"
  | "naturopathic"
  | "aesthetic"
  | "reproductive_health"
  | "pediatric"
  | "travel_health"
  | "cannabis_pain"
  | "telehealth"
  | "private_surgical"
  | "pharmacy_clinical";

export type Segment = {
  key: SegmentKey;
  label: string;
  blurb: string;
  /** CSS variable name in app/globals.css */
  cssVar: `--seg-${SegmentKey}`;
  /** Static hex fallback (matches dark theme value). */
  hex: string;
};

export const segments: Segment[] = [
  {
    key: "primary_care",
    label: "Primary care",
    blurb: "UPCC, walk-in, family practice",
    cssVar: "--seg-primary_care",
    hex: "#C9A961",
  },
  {
    key: "diagnostic",
    label: "Diagnostic",
    blurb: "Imaging, lab",
    cssVar: "--seg-diagnostic",
    hex: "#C57A4F",
  },
  {
    key: "specialist",
    label: "Specialist",
    blurb: "Cardio, derm, ENT, ortho",
    cssVar: "--seg-specialist",
    hex: "#B5553C",
  },
  {
    key: "dental",
    label: "Dental",
    blurb: "General, ortho, oral surgery",
    cssVar: "--seg-dental",
    hex: "#E8DCC4",
  },
  {
    key: "vision",
    label: "Vision",
    blurb: "Optometry, ophthalmology",
    cssVar: "--seg-vision",
    hex: "#7B96B5",
  },
  {
    key: "mental_health",
    label: "Mental health",
    blurb: "Psychiatry, psychology, counselling",
    cssVar: "--seg-mental_health",
    hex: "#A6B89A",
  },
  {
    key: "allied_health",
    label: "Allied health",
    blurb: "Physio, chiro, massage, acupuncture",
    cssVar: "--seg-allied_health",
    hex: "#859E68",
  },
  {
    key: "naturopathic",
    label: "Naturopathic",
    blurb: "Naturopaths, integrative",
    cssVar: "--seg-naturopathic",
    hex: "#5C8A5E",
  },
  {
    key: "aesthetic",
    label: "Aesthetic",
    blurb: "Med spa, cosmetic derm, plastics",
    cssVar: "--seg-aesthetic",
    hex: "#C68A95",
  },
  {
    key: "reproductive_health",
    label: "Reproductive health",
    blurb: "Fertility, sexual health, midwifery",
    cssVar: "--seg-reproductive_health",
    hex: "#D88876",
  },
  {
    key: "pediatric",
    label: "Pediatric",
    blurb: "Children's care",
    cssVar: "--seg-pediatric",
    hex: "#D4A37A",
  },
  {
    key: "travel_health",
    label: "Travel health",
    blurb: "Vaccines, prescriptions",
    cssVar: "--seg-travel_health",
    hex: "#B89A52",
  },
  {
    key: "cannabis_pain",
    label: "Cannabis & pain",
    blurb: "Pain management, medical cannabis",
    cssVar: "--seg-cannabis_pain",
    hex: "#8B8B5A",
  },
  {
    key: "telehealth",
    label: "Telehealth",
    blurb: "Virtual-first practices",
    cssVar: "--seg-telehealth",
    hex: "#8E91C2",
  },
  {
    key: "private_surgical",
    label: "Private surgical",
    blurb: "Day surgery, private centres",
    cssVar: "--seg-private_surgical",
    hex: "#8E4F5C",
  },
  {
    key: "pharmacy_clinical",
    label: "Clinical pharmacy",
    blurb: "Prescribing pharmacists, injections",
    cssVar: "--seg-pharmacy_clinical",
    hex: "#A87F6B",
  },
];
