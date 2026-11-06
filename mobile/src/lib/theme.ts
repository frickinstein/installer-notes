// Mirrors the web design tokens in ../src/app/globals.css. Keep the two in step.
export const colors = {
  primary: "#E31C23",
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceHover: "#263348",
  border: "#2D3A4D",
  text: "#CBD5E1",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  textBright: "#F1F5F9",
  white: "#FFFFFF",
  green: "#4ADE80",
  yellow: "#FACC15",
  red: "#F87171",
  amber: "#FBBF24",
  amberBg: "rgba(245, 158, 11, 0.15)",
  amberBorder: "rgba(245, 158, 11, 0.3)",
  primaryBg: "rgba(227, 28, 35, 0.12)",
  primaryBorder: "rgba(227, 28, 35, 0.25)",
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 } as const;
export const radius = { sm: 4, md: 8, lg: 12, full: 999 } as const;

export const font = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;
