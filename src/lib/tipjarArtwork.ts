import QRCode from 'qrcode';

export const TIPJAR_IMAGE =
  'https://blossom.primal.net/9f7debc14b9df626afbf261c69586e19c98470bc4f47c0e5b969af9a825704d1.png';

export const BITCOIN_BADGE =
  'https://blossom.dreamith.to/6aaee5d7b3ef908f0662759a1053466a8d378c86eafee216bb477b0252983bc9.png';

const ASSET_TIMEOUT_MS = 15000;

/**
 * The app is shipped as an Android APK whose runtime is a bare system WebView
 * (zapstore/goapk). That WebView does not implement `window.print()` — the call
 * resolves immediately and nothing happens — and it also does not expose the
 * Web Share API or a download listener. So we detect it and render the artwork
 * to an image the user can save instead.
 */
export function isWebViewApp(): boolean {
  if (typeof window === 'undefined') return false;

  const bridge = (window as unknown as { NativeBridge?: { getPlatform?: () => string } })
    .NativeBridge;
  if (bridge && typeof bridge.getPlatform === 'function' && bridge.getPlatform() === 'android') {
    return true;
  }

  return /; wv\)/i.test(navigator.userAgent || '');
}

interface ArtworkOptions {
  address: string;
  lightningUri: string;
}

interface PanelAssets {
  tip: HTMLImageElement;
  badge: HTMLImageElement;
}

interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Size {
  w: number;
  h: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Timed out loading ${src}`));
    }, ASSET_TIMEOUT_MS);

    img.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(new Error(`Failed to load ${src}`));
    };

    img.src = src;
  });
}

async function loadQr(value: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, value || ' ', {
    width: 640,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
  return canvas;
}

function fitSize(naturalW: number, naturalH: number, maxW: number, maxH: number): Size {
  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  return { w: naturalW * scale, h: naturalH * scale };
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

/** Draws a single tip-jar face (used for the sticker and each tri-fold panel). */
function drawFace(
  ctx: CanvasRenderingContext2D,
  rect: PanelRect,
  assets: PanelAssets,
  qr: HTMLCanvasElement,
  address: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  const cx = rect.x + rect.w / 2;
  const pad = rect.w * 0.05;
  const innerW = rect.w - pad * 2;
  const gap = Math.round(rect.h * 0.02);
  const textSize = Math.max(12, Math.round(rect.h * 0.03));

  const tip = fitSize(
    assets.tip.naturalWidth || 1,
    assets.tip.naturalHeight || 1,
    innerW * 0.85,
    rect.h * 0.22,
  );
  const badge = fitSize(
    assets.badge.naturalWidth || 1,
    assets.badge.naturalHeight || 1,
    innerW * 0.8,
    rect.h * 0.16,
  );
  const qrSize = Math.min(innerW * 0.62, rect.h * 0.4);
  const textH = Math.round(textSize * 1.2);

  const totalH = tip.h + gap + qrSize + gap + badge.h + gap + textH;
  let cursor = rect.y + (rect.h - totalH) / 2;

  ctx.drawImage(assets.tip, cx - tip.w / 2, cursor, tip.w, tip.h);
  cursor += tip.h + gap;

  ctx.drawImage(qr, cx - qrSize / 2, cursor, qrSize, qrSize);
  cursor += qrSize + gap;

  ctx.drawImage(assets.badge, cx - badge.w / 2, cursor, badge.w, badge.h);
  cursor += badge.h + gap;

  ctx.fillStyle = '#666666';
  ctx.font = `${textSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateToWidth(ctx, address, innerW), cx, cursor);

  ctx.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export the artwork as an image'));
    }, 'image/png');
  });
}

async function loadAssets(lightningUri: string): Promise<[PanelAssets, HTMLCanvasElement]> {
  const [tip, badge, qr] = await Promise.all([
    loadImage(TIPJAR_IMAGE),
    loadImage(BITCOIN_BADGE),
    loadQr(lightningUri),
  ]);
  return [{ tip, badge }, qr];
}

/** Renders the square sticker (3in × 3in at ~300 DPI) to a PNG blob. */
export async function renderStickerPng(options: ArtworkOptions): Promise<Blob> {
  const size = 900;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not supported');

  const [assets, qr] = await loadAssets(options.lightningUri);
  drawFace(ctx, { x: 0, y: 0, w: size, h: size }, assets, qr, options.address);

  return canvasToBlob(canvas);
}

/** Renders the tri-fold sign (three panels) to a PNG blob. */
export async function renderTrifoldPng(options: ArtworkOptions): Promise<Blob> {
  const panelW = 1000;
  const panelH = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = panelW * 3;
  canvas.height = panelH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not supported');

  const [assets, qr] = await loadAssets(options.lightningUri);

  drawFace(ctx, { x: 0, y: 0, w: panelW, h: panelH }, assets, qr, options.address);
  drawFace(
    ctx,
    { x: panelW, y: 0, w: panelW, h: panelH },
    assets,
    qr,
    options.address,
  );

  // Third panel: the fold & tuck-under flap.
  const flapX = panelW * 2;
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(flapX, 0, panelW, panelH);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = `600 ${Math.round(panelH * 0.03)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↓ FOLD & TUCK UNDER ↓', flapX + panelW / 2, panelH / 2);

  // Dashed fold guides between panels.
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 14]);
  for (const bx of [panelW, panelW * 2]) {
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, panelH);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  return canvasToBlob(canvas);
}

type ShareNavigator = Navigator & {
  canShare?: (data: { files?: File[] }) => boolean;
  share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
};

/**
 * Best-effort save of a rendered PNG. Tries the native share sheet first
 * (Android Chrome / iOS Safari), then a download. Returns how it was handled so
 * the caller can decide whether to also show the image for a manual save.
 */
export async function saveArtwork(blob: Blob, filename: string): Promise<'share' | 'download'> {
  const nav = navigator as ShareNavigator;
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof nav.canShare === 'function' && typeof nav.share === 'function') {
    try {
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'Lightning Tip Jar' });
        return 'share';
      }
    } catch {
      // User cancelled or sharing is unavailable — fall through to a download.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'download';
}
