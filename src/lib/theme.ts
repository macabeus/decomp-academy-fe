// Single source of truth for the design palette.
//
// Tailwind reads this in `tailwind.config.ts` to generate semantic utilities,
// and Monaco reads the raw hex below for the editor theme — so the syntax
// colors in the code editor can never drift from the ones in the asm diff.

export const palette = {
  // Surfaces — darkest (inset, e.g. code) → lightest chrome. Faintly
  // purple-tinted near-blacks so the dark theme reads as the GameCube-purple
  // brand; luminance is held close to the original neutral values.
  bg: {
    DEFAULT: "#0e0c16",
    soft: "#17141f",
    softer: "#1f1a2b",
    inset: "#0a0810",
  },
  // Borders / hairlines, three weights. Kept low-contrast for a flat theme that
  // separates surfaces mostly by background elevation, not hard outlines.
  line: {
    DEFAULT: "#221c30",
    strong: "#2e2740",
    faint: "#181323",
  },
  // Semantic text scale. Replaces the ~50 one-off greys the UI used to hardcode.
  // `faint`/`ghost` were lifted from #5b6675/#3a4757 to clear WCAG AA on #0d1117.
  content: {
    bright: "#f0f3f8", // headings
    primary: "#e6ebf2", // strong labels, active states
    DEFAULT: "#c4cdd9", // body
    secondary: "#b3bdca", // softer body
    muted: "#8b97a6", // captions, meta
    faint: "#7a8696", // empty states, disabled text (AA on bg)
    ghost: "#56636f", // line numbers, off pips
  },
  // GameCube-purple brand accent. Mirrors the {dA} logo palette
  // (#6C4FD6 violet / #A78BFA lavender). Kept light enough to clear WCAG AA as
  // link text on the dark surfaces below.
  accent: {
    DEFAULT: "#8b6cf0", // primary: links, fills, focus
    soft: "#5b3fc9", // deep violet: borders, secondary accent
    hover: "#a78bfa", // lavender: hover / lighter state
    on: "#140e22", // text/icon color when sitting ON an accent fill
    grad: "#bca4ff", // gradient terminal stop (pale violet)
  },
  good: {
    DEFAULT: "#3fb950",
    soft: "#56d364",
  },
  warn: "#d29922",
  bad: {
    DEFAULT: "#f85149",
    text: "#d6938c", // console error foreground
  },
  // Shared syntax palette — consumed by both AsmDiff (Tailwind) and Monaco (hex).
  syntax: {
    mnemonic: "#ff9b85",
    keyword: "#ff7b72",
    reg: "#7ee787",
    num: "#79c0ff",
    str: "#a5d6ff",
    comment: "#6b7686",
    ident: "#c9d1d9",
  },
} as const;
