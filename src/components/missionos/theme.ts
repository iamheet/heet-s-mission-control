/**
 * JARVIS Mission OS — accent palette + small style helpers.
 * All widget accents reference this map so a later theme swap is one-file.
 */

export const ACCENT = {
  cyan: "#00E5FF", // primary
  cyan2: "#00B8D4",
  pink: "#A78BFA", // kept in the violet family for a premium, non-gaming look
  purple: "#8B5CF6", // accent
  green: "#00FFB3", // success
  amber: "#FFC857", // warning
  red: "#FF4D6D", // danger
  blue: "#6C63FF", // secondary
  teal: "#2DD4BF",
} as const;

export type AccentKey = keyof typeof ACCENT;

/** Core surface tokens (background / glass panel / hairline border / dim text). */
export const SURFACE = {
  bg: "#050816",
  panel: "rgba(14,22,35,0.72)",
  border: "rgba(0,229,255,0.18)",
  borderHover: "rgba(0,229,255,0.42)",
  textDim: "#6B7C99",
} as const;

/** Text glow matching an accent colour (for numeric stats / headings). */
export const neon = (hex: string, blur = 8): React.CSSProperties => ({
  textShadow: `0 0 ${blur}px ${hex}aa`,
});

/** Soft outer glow for a card / element, tuned low so it reads as ambient. */
export const glow = (hex: string, blur = 20, alpha = "14"): React.CSSProperties => ({
  boxShadow: `0 0 ${blur}px ${hex}${alpha}`,
});

/** Append an 8-bit alpha channel to a hex colour, e.g. hexA("#22D3EE", 0.2). */
export const hexA = (hex: string, a: number): string => {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${v}`;
};
