// Filter pipeline: each filter is a CSS/canvas filter string, so the same value
// previews live on <video> and bakes into the captured image via ctx.filter.
// A future native/AR layer can register filters with the same shape.
export type LensFilter = { id: string; name: string; category: string; css: string; swatch: string };

export const FILTERS: LensFilter[] = [
  { id: "none", name: "Original", category: "Basic", css: "", swatch: "oklch(0.6 0 0)" },
  { id: "vivid", name: "Vivid", category: "Color Grading", css: "saturate(1.5) contrast(1.1)", swatch: "oklch(0.7 0.2 30)" },
  { id: "warm", name: "Chai", category: "Color Grading", css: "sepia(0.25) saturate(1.3) hue-rotate(-10deg)", swatch: "oklch(0.72 0.15 60)" },
  { id: "cool", name: "Monsoon", category: "Color Grading", css: "saturate(1.1) hue-rotate(15deg) brightness(1.05)", swatch: "oklch(0.7 0.12 230)" },
  { id: "noir", name: "Noir", category: "Cinematic", css: "grayscale(1) contrast(1.35)", swatch: "oklch(0.3 0 0)" },
  { id: "teal", name: "Bollywood", category: "Cinematic", css: "contrast(1.2) saturate(1.2) hue-rotate(-8deg) sepia(0.15)", swatch: "oklch(0.6 0.12 190)" },
  { id: "fade", name: "Matte", category: "Cinematic", css: "contrast(0.85) brightness(1.1) saturate(0.8)", swatch: "oklch(0.75 0.03 285)" },
  { id: "retro", name: "Retro 90s", category: "Vintage", css: "sepia(0.6) contrast(1.1) saturate(1.2)", swatch: "oklch(0.65 0.1 70)" },
  { id: "polaroid", name: "Polaroid", category: "Vintage", css: "sepia(0.3) brightness(1.1) contrast(0.95)", swatch: "oklch(0.85 0.05 85)" },
  { id: "dream", name: "Dreamy", category: "Anime and Artistic", css: "saturate(1.6) brightness(1.1) hue-rotate(20deg) blur(0.4px)", swatch: "oklch(0.75 0.15 330)" },
  { id: "neon", name: "Neon", category: "Anime and Artistic", css: "saturate(2) contrast(1.3) hue-rotate(260deg)", swatch: "oklch(0.65 0.25 295)" },
  { id: "invert", name: "X-Ray", category: "Funny Effects", css: "invert(1) hue-rotate(180deg)", swatch: "oklch(0.8 0.1 200)" },
  { id: "soft", name: "Glow", category: "Beauty Filters", css: "brightness(1.08) contrast(0.95) saturate(1.1) blur(0.3px)", swatch: "oklch(0.85 0.06 20)" },
];

export type Adjustments = { brightness: number; contrast: number; saturation: number; blur: number };
export const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100, blur: 0 };

export function composeFilter(f: LensFilter, a: Adjustments) {
  const adj = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) blur(${a.blur}px)`;
  return `${f.css} ${adj}`.trim();
}
