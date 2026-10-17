export const TIPJAR_IMAGE =
  'https://blossom.primal.net/9f7debc14b9df626afbf261c69586e19c98470bc4f47c0e5b969af9a825704d1.png';

export const BITCOIN_BADGE =
  'https://blossom.dreamith.to/6aaee5d7b3ef908f0662759a1053466a8d378c86eafee216bb477b0252983bc9.png';

/**
 * The app is shipped as an Android APK whose runtime is a bare system WebView
 * (zapstore/goapk). That WebView does not implement `window.print()` — the call
 * does nothing — and it has no download handler, no Web Share API, and no
 * long-press "save image" menu. Its only native bridge method is
 * `NativeBridge.getPlatform()`.
 *
 * So inside the app we show the artwork full screen instead, so it can be
 * captured with a screenshot and printed from the photo gallery.
 */
export function isWebViewApp(): boolean {
  if (typeof window === 'undefined') return false;

  // goapk serves the bundled site from this virtual origin.
  if (window.location.hostname === 'appassets.androidplatform.net') return true;

  try {
    const bridge = (window as unknown as { NativeBridge?: { getPlatform?: () => string } })
      .NativeBridge;
    if (bridge && typeof bridge.getPlatform === 'function' && bridge.getPlatform() === 'android') {
      return true;
    }
  } catch {
    // Ignore bridge errors and fall through to the other checks.
  }

  // Generic Android WebView user agent, or no print support at all.
  if (/; wv\)/i.test(navigator.userAgent || '')) return true;
  return typeof window.print !== 'function';
}
