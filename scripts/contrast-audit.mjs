// Auditoría instrumental de contraste WCAG (AAA 7:1 texto, 3:1 UI/foco).
// Lee los tokens --ds-* de src/styles/index.css (:root y .light) y calcula ratios.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const CSS_PATH = resolve(here, '../src/styles/index.css');

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const parseHex = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const blend = (fg, bg, a) => '#' + parseHex(fg).map((c, i) => Math.round(c * a + parseHex(bg)[i] * (1 - a)).toString(16).padStart(2, '0')).join('');
export const ratio = (a, b) => {
  const [l1, l2] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

export function readTheme(css, selectorRe) {
  const m = css.match(new RegExp(selectorRe + '\\s*\\{([\\s\\S]*?)\\n\\}'));
  const vars = {};
  for (const [, k, v] of m[1].matchAll(/(--ds-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) vars[k] = v;
  return vars;
}

// Colores de estado (texto sobre fondo) por tema: definidos como tokens --ds-*
const SURFACES = ['--ds-background', '--ds-surface', '--ds-surface-hover', '--ds-surface-elevated'];
const TEXT = ['--ds-primary', '--ds-secondary', '--ds-tertiary'];
const STATUS = ['--ds-success-text', '--ds-warning-text', '--ds-error-text', '--ds-info-text', '--ds-accent-text'];

export function audit(css = readFileSync(CSS_PATH, 'utf8')) {
  const results = [];
  for (const [mode, re] of [['dark', ':root'], ['light', '\\.light']]) {
    const t = readTheme(css, re);
    for (const fg of [...TEXT, ...STATUS]) {
      for (const bg of SURFACES) {
        if (!t[fg] || !t[bg]) { results.push({ mode, fg, bg, ratio: 0, min: 7, pass: false, note: 'token ausente' }); continue; }
        const r = ratio(t[fg], t[bg]);
        results.push({ mode, fg, bg, ratio: +r.toFixed(2), min: 7, pass: r >= 7 });
      }
    }
    // Texto sobre acento (botones/chips activos)
    const accent = '#10b981';
    if (t['--ds-on-accent']) {
      const r = ratio(t['--ds-on-accent'], accent);
      results.push({ mode, fg: '--ds-on-accent', bg: 'accent #10b981', ratio: +r.toFixed(2), min: 7, pass: r >= 7 });
    }
    // Foco 1.4.11 ≥ 3:1 contra superficies
    for (const bg of SURFACES) {
      const r = ratio(t['--ds-focus-ring'], t[bg]);
      results.push({ mode, fg: '--ds-focus-ring', bg, ratio: +r.toFixed(2), min: 3, pass: r >= 3 });
    }
      // Texto de estado sobre chips tintados (color base al 20% sobre cada superficie)
    const BASE = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6', accent: '#10b981' };
    for (const [k, base] of Object.entries(BASE)) {
      for (const bg of SURFACES) {
        const chip = blend(base, t[bg], 0.2);
        const r = ratio(t['--ds-' + k + '-text'], chip);
        results.push({ mode, fg: '--ds-' + k + '-text', bg: 'chip20% ' + bg.slice(5), ratio: +r.toFixed(2), min: 7, pass: r >= 7 });
      }
    }
  }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = audit();
  for (const r of res) console.log(`${r.pass ? 'OK  ' : 'FAIL'} ${r.mode.padEnd(5)} ${r.fg.padEnd(20)} sobre ${r.bg.padEnd(22)} ${String(r.ratio).padStart(5)}:1 (min ${r.min})${r.note ? ' ' + r.note : ''}`);
  const fails = res.filter((r) => !r.pass);
  console.log(`\n${res.length - fails.length}/${res.length} combinaciones OK`);
  process.exit(fails.length ? 1 : 0);
}
