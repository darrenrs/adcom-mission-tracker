/**
 * The one look for every text and number field, so they match across pages. Add width and alignment where used, and
 * px-* to change the side padding (the default comes from `.field` in styles.css, so any px-* overrides it).
 * An invalid value turns the field red; the reason is only read out to screen readers, never shown as text.
 * 14px on every device and never condensed; `ui/iosZoom.ts` keeps iOS from zooming into it.
 */
export const inputClass =
  'field h-control min-w-0 rounded-lg border border-line bg-canvas font-mono text-sm tabular-nums placeholder:text-muted disabled:opacity-50 aria-invalid:border-danger aria-invalid:bg-danger-soft aria-invalid:ring-1 aria-invalid:ring-danger';
