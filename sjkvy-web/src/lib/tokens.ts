// tokens.ts — the SJKVY design tokens, mirrored from the Stitch export for use in TS
// (charts, inline styles, etc.). The authoritative source is tailwind.config.js; these
// are the same values for programmatic access. Do not diverge from the Tailwind config.
export const colors = {
  primary: "#316342",
  primaryContainer: "#4a7c59",
  onPrimary: "#ffffff",
  secondary: "#775a19",
  secondaryContainer: "#fed488",
  tertiary: "#57595b",
  surface: "#fcf9f8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  onSurface: "#1b1c1b",
  onSurfaceVariant: "#414942",
  outline: "#717971",
  outlineVariant: "#c1c9bf",
  error: "#ba1a1a",
} as const;

export const fonts = {
  display: "'Playfair Display', serif",
  body: "'Inter', sans-serif",
} as const;

export const spacing = {
  marginDesktop: "48px",
  marginMobile: "16px",
  gutter: "24px",
  topbarHeight: "72px",
  maxWidth: "1440px",
} as const;

export const radius = {
  DEFAULT: "0.125rem",
  lg: "0.25rem",
  xl: "0.5rem",
  full: "0.75rem",
} as const;
