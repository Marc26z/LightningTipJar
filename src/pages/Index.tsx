import { useSeoMeta } from '@unhead/react';
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from '@/components/ui/qrcode';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Printer, Zap, Sticker, TriangleAlert, X } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import {
  BITCOIN_BADGE,
  TIPJAR_IMAGE,
  isWebViewApp,
  renderStickerPng,
  renderTrifoldPng,
  saveArtwork,
} from '@/lib/tipjarArtwork';

type PrintMode = 'sticker' | 'trifold';

/** Reusable sticker panel content (used for both sticker & tri-fold faces). */
function StickerFace({ lightningUri, address, qrSize, imgWidth, badgeWidth, fontSize }: {
  lightningUri: string;
  address: string;
  qrSize: number;
  imgWidth: string;
  badgeWidth: string;
  fontSize: string;
}) {
  return (
    <>
      <img
        src={TIPJAR_IMAGE}
        alt="Tip Jar"
        className="object-contain shrink-0"
        style={{ width: imgWidth }}
        crossOrigin="anonymous"
      />
      <div className="flex-1 flex items-center justify-center">
        <QRCodeCanvas value={lightningUri} size={qrSize} level="M" />
      </div>
      <img
        src={BITCOIN_BADGE}
        alt="Bitcoin Lightning Accepted Here"
        className="object-contain shrink-0"
        style={{ width: badgeWidth }}
        crossOrigin="anonymous"
      />
      <p
        className="font-mono leading-none truncate max-w-full shrink-0"
        style={{ fontSize, color: '#666', letterSpacing: '-0.02em' }}
      >
        {address}
      </p>
    </>
  );
}

const Index = () => {
  useSeoMeta({
    title: '⚡ Bitcoin Tip Jar — Sticker & Sign Generator',
    description: 'Generate a printable 3x3 sticker or tri-fold table sign with a QR code for your Lightning address. Stick it on a tip jar and start receiving zaps!',
  });

  const [address, setAddress] = useState('');
  const [generatedAddress, setGeneratedAddress] = useState('');
  const [printMode, setPrintMode] = useState<PrintMode>('sticker');
  const [artwork, setArtwork] = useState<{ url: string; filename: string; blob: Blob } | null>(null);
  const [preparing, setPreparing] = useState(false);

  const lightningUri = generatedAddress ? `lightning:${generatedAddress}` : '';

  const handleGenerate = useCallback(() => {
    const trimmed = address.trim();
    if (trimmed && trimmed.includes('@')) {
      setGeneratedAddress(trimmed);
    }
  }, [address]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  }, [handleGenerate]);

  const handlePrint = useCallback(async () => {
    // Inside the packaged Android app (a bare system WebView) `window.print()`
    // is a no-op, so render the artwork to an image the user can save instead.
    if (isWebViewApp()) {
      if (!generatedAddress) return;
      setPreparing(true);
      try {
        const blob = printMode === 'sticker'
          ? await renderStickerPng({ address: generatedAddress, lightningUri })
          : await renderTrifoldPng({ address: generatedAddress, lightningUri });
        const filename = printMode === 'sticker' ? 'lightning-tip-jar-sticker.png' : 'lightning-tip-jar-sign.png';
        setArtwork({ url: URL.createObjectURL(blob), filename, blob });
        await saveArtwork(blob, filename);
      } catch (error) {
        console.error('Failed to render printable artwork:', error);
        toast({
          variant: 'destructive',
          title: 'Could not create the image',
          description: 'Check your connection and try again.',
        });
      } finally {
        setPreparing(false);
      }
      return;
    }

    // Browsers: inject a dynamic @page size rule based on mode, then remove after print
    const style = document.createElement('style');
    if (printMode === 'sticker') {
      // Standard letter page so it prints exactly one page
      style.textContent = '@page { size: letter; margin: 0; }';
    } else {
      style.textContent = '@page { size: letter landscape; margin: 0.25in; }';
    }
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, [printMode, generatedAddress, lightningUri]);

  const closeArtwork = useCallback(() => {
    setArtwork((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-950 dark:to-gray-900">
      {/* ===== SCREEN-ONLY UI ===== */}
      <div className="print:hidden">
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              ⚡Lightning Tip Jar ⚡
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Generate a printable sticker or table sign with a QR code for your Lightning tip jar
            </p>
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-amber-100 dark:border-gray-700 max-w-lg mx-auto">
            <label htmlFor="lightning-address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Your Lightning Address
            </label>
            <div className="flex gap-3">
              <Input
                id="lightning-address"
                type="text"
                placeholder="you@wallet.com"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-12 text-lg px-4 rounded-xl"
              />
              <Button
                onClick={handleGenerate}
                disabled={!address.trim() || !address.includes('@')}
                className="h-12 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base shadow-md"
              >
                <Zap className="size-5" />
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter your Lightning address (e.g. name@walletofsatoshi.com)
            </p>

            {/* Embedded tutorial video */}
            <div className="mt-4 rounded-xl overflow-hidden aspect-video">
              <iframe
                src="https://www.youtube.com/embed/hmjzG8rVvV0"
                title="Lightning Address Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>

          {/* Previews */}
          {generatedAddress && (
            <div className="flex flex-col items-center gap-6">
              {/* Mode tabs */}
              <Tabs value={printMode} onValueChange={(v) => setPrintMode(v as PrintMode)} className="w-full max-w-md">
                <TabsList className="w-full">
                  <TabsTrigger value="sticker" className="gap-2">
                    <Sticker className="size-4" />
                    Square Sticker
                  </TabsTrigger>
                  <TabsTrigger value="trifold" className="gap-2">
                    <TriangleAlert className="size-4" />
                    Tri-Fold Sign
                  </TabsTrigger>
                </TabsList>

                {/* ---- Sticker Tab ---- */}
                <TabsContent value="sticker" className="flex flex-col items-center gap-6 pt-4">
                  <div className="bg-white rounded-2xl shadow-2xl p-1 border-2 border-dashed border-gray-300">
                    <div className="w-[288px] h-[288px] bg-white rounded-xl flex flex-col items-center justify-center p-3 gap-1.5 overflow-hidden">
                      <StickerFace
                        lightningUri={lightningUri}
                        address={generatedAddress}
                        qrSize={140}
                        imgWidth="160px"
                        badgeWidth="150px"
                        fontSize="8px"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handlePrint}
                    disabled={preparing}
                    size="lg"
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold text-base px-8 shadow-lg"
                  >
                    {preparing ? <Loader2 className="size-5 animate-spin" /> : <Printer className="size-5" />}
                    Print Sticker
                  </Button>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Prints a 3×3 inch square sticker. Use sticker paper for best results!
                  </p>
                </TabsContent>

                {/* ---- Tri-Fold Tab ---- */}
                <TabsContent value="trifold" className="flex flex-col items-center gap-6 pt-4">
                  {/* Scaled-down preview of the tri-fold sheet */}
                  <div className="bg-white rounded-2xl shadow-2xl p-2 border-2 border-dashed border-gray-300 overflow-hidden">
                    <div className="w-[480px] h-[192px] bg-white flex relative overflow-hidden">
                      {/* Panel 1: Front face (upright) */}
                      <div className="w-1/3 h-full flex flex-col items-center justify-center p-2 gap-1 border-r border-dashed border-gray-300">
                        <StickerFace
                          lightningUri={lightningUri}
                          address={generatedAddress}
                          qrSize={80}
                          imgWidth="90px"
                          badgeWidth="85px"
                          fontSize="5px"
                        />
                      </div>

                      {/* Panel 2: Back face */}
                      <div className="w-1/3 h-full flex flex-col items-center justify-center p-2 gap-1 border-r border-dashed border-gray-300">
                        <StickerFace
                          lightningUri={lightningUri}
                          address={generatedAddress}
                          qrSize={80}
                          imgWidth="90px"
                          badgeWidth="85px"
                          fontSize="5px"
                        />
                      </div>

                      {/* Panel 3: Bottom flap (tuck-under) */}
                      <div className="w-1/3 h-full flex flex-col items-center justify-center p-3 gap-1 bg-gray-50">
                        <p className="text-[7px] text-gray-400 font-medium uppercase tracking-widest">↓ Fold &amp; tuck under ↓</p>
                        <div className="flex-1 flex items-center justify-center opacity-30">
                          <Zap className="size-10 text-amber-400 fill-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assembly instructions */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 max-w-md border border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">How to fold:</h3>
                    <ol className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                      <li>Cut along the outer border</li>
                      <li>Fold along the two dashed lines to form a triangle</li>
                      <li>Tuck the third panel under to hold the shape</li>
                      <li>Stand it up — both visible sides show the QR code!</li>
                    </ol>
                  </div>

                  <Button
                    onClick={handlePrint}
                    disabled={preparing}
                    size="lg"
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold text-base px-8 shadow-lg"
                  >
                    {preparing ? <Loader2 className="size-5 animate-spin" /> : <Printer className="size-5" />}
                    Print Tri-Fold Sign
                  </Button>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Prints on a standard landscape page. Cut, fold, and stand!
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-16 pb-8">
            <p className="text-xs text-muted-foreground">
              Vibed with{' '}
              <a
                href="https://shakespeare.diy"
                className="underline hover:text-amber-600 transition-colors"
              >
                Shakespeare
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ===== PRINT-ONLY LAYOUTS ===== */}
      {generatedAddress && (
        <>
          {/* Sticker print (3x3 inch on letter page, positioned slightly below top) */}
          {printMode === 'sticker' && (
            <div
              className="hidden print:flex"
              style={{
                paddingTop: '1in',
                paddingLeft: '0.5in',
                width: '8.5in',
                boxSizing: 'border-box',
              }}
            >
              <div
                className="print-sticker"
                style={{
                  width: '3in',
                  height: '3in',
                  padding: '0.15in',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.08in',
                  backgroundColor: 'white',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  pageBreakAfter: 'avoid',
                  breakAfter: 'avoid',
                }}
              >
                <StickerFace
                  lightningUri={lightningUri}
                  address={generatedAddress}
                  qrSize={384}
                  imgWidth="1.33in"
                  badgeWidth="1.22in"
                  fontSize="6pt"
                />
              </div>
            </div>
          )}

          {/* Tri-fold print (landscape letter) */}
          {printMode === 'trifold' && (
            <div className="hidden print:block print:p-0 print:m-0">
              <div
                className="print-trifold"
                style={{
                  width: '10in',
                  height: '3.33in',
                  display: 'flex',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                }}
              >
                {/* Panel 1: Front face */}
                <div
                  style={{
                    width: '33.333%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2in',
                    gap: '0.06in',
                    boxSizing: 'border-box',
                    borderRight: '1px dashed #ccc',
                  }}
                >
                  <StickerFace
                    lightningUri={lightningUri}
                    address={generatedAddress}
                    qrSize={384}
                    imgWidth="1.5in"
                    badgeWidth="1.3in"
                    fontSize="6pt"
                  />
                </div>

                {/* Panel 2: Back face */}
                <div
                  style={{
                    width: '33.333%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2in',
                    gap: '0.06in',
                    boxSizing: 'border-box',
                    borderRight: '1px dashed #ccc',
                  }}
                >
                  <StickerFace
                    lightningUri={lightningUri}
                    address={generatedAddress}
                    qrSize={384}
                    imgWidth="1.5in"
                    badgeWidth="1.3in"
                    fontSize="6pt"
                  />
                </div>

                {/* Panel 3: Bottom tuck flap */}
                <div
                  style={{
                    width: '33.333%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.3in',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <p
                    style={{
                      fontSize: '8pt',
                      color: '#aaa',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ↓ Fold &amp; tuck under ↓
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== IN-APP ARTWORK PREVIEW (was printing is unavailable) ===== */}
      {artwork && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center gap-4 p-5">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {printMode === 'sticker' ? 'Your Sticker' : 'Your Tri-Fold Sign'}
              </h2>
              <Button
                onClick={closeArtwork}
                variant="ghost"
                size="icon"
                aria-label="Close preview"
                className="rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <X className="size-5" />
              </Button>
            </div>

            <img
              src={artwork.url}
              alt="Printable tip jar artwork"
              className="w-full max-h-[55vh] object-contain rounded-lg border border-gray-200 bg-white"
            />

            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              Printing isn't available inside the app. Long-press the image to save it, or take a
              screenshot, then print it from your photos.
            </p>

            <div className="flex gap-3 w-full">
              <Button onClick={closeArtwork} variant="outline" className="flex-1 rounded-xl">
                Close
              </Button>
              <Button
                onClick={() => saveArtwork(artwork.blob, artwork.filename)}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                Save / Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
