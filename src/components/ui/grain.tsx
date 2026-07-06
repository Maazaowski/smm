/**
 * Fixed, low-opacity film grain overlay for organic warmth. Pure CSS
 * (SVG fractal-noise data URI), no JS, sits above the background blobs
 * but below content (pointer-events: none).
 */
export function Grain() {
  return <div className="grain-overlay" aria-hidden="true" />;
}
