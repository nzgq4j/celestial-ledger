// WCAG contrast helpers.
const hex = (h: string): [number, number, number] => {
  const v = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
};
const toHex = (rgb: number[]) => '#' + rgb.map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const luminance = (h: string): number => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * The colour closest to `color` that reaches `ratio` against `bg`, moving toward
 * black on light backgrounds and toward white on dark ones. Returns `color` when it already passes.
 */
export function readable(color: string, bg: string, ratio = 4.5): string {
  if (contrast(color, bg) >= ratio) return color;
  const target = luminance(bg) > 0.18 ? 0 : 255;
  const rgb = hex(color);
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = toHex(rgb.map(v => v + (target - v) * t));
    if (contrast(c, bg) >= ratio) return c;
  }
  return target === 0 ? '#000000' : '#ffffff';
}
