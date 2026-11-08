/**
 * The one look for every text and number field, so they match across pages. Add width and alignment where used.
 * An invalid value turns the field red; the reason is only read out to screen readers, never shown as text.
 */
export const inputClass =
  'h-control min-w-0 rounded-lg border border-line bg-canvas px-2 font-mono text-base tabular-nums placeholder:text-muted pointer-fine:text-sm disabled:opacity-50 aria-invalid:border-danger aria-invalid:bg-danger-soft aria-invalid:ring-1 aria-invalid:ring-danger';
