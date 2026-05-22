import { useSeoMeta } from '@unhead/react';
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from '@/components/ui/qrcode';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Printer, Zap, Sticker, TriangleAlert } from 'lucide-react';

const TIPJAR_IMAGE = 'https://blossom.primal.net/9f7debc14b9df626afbf261c69586e19c98470bc4f47c0e5b969af9a825704d1.png';
const BITCOIN_BADGE = 'https://blossom.dreamith.to/6aaee5d7b3ef908f0662759a1053466a8d378c86eafee216bb477b0252983bc9.png';

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
    title: '⚡ Lightning Tip Jar — Sticker & Sign Generator',
    description: 'Generate a printable 3x3 sticker or tri-fold table sign with a QR code for your Lightning address. Stick it on a tip jar and start receiving zaps!',
  });

  const [address, setAddress] = useState('');
  const [generatedAddress, setGeneratedAddress] = useState('');
  const [printMode, setPrintMode] = useState<PrintMode>('sticker');

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

  const handlePrint = useCallback(() => {
    // Inject a dynamic @page size rule based on mode, then remove after print
    const style = document.createElement('style');
    if (printMode === 'sticker') {
      style.textContent = '@page { size: 3in 3in; margin: 0; }';
    } else {
      style.textContent = '@page { size: 10in 3.33in; margin: 0; }';
    }
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, [printMode]);

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
                    size="lg"
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold text-base px-8 shadow-lg"
                  >
                    <Printer className="size-5" />
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

                      {/* Panel 2: Back face (upside-down so it shows when folded) */}
                      <div className="w-1/3 h-full flex flex-col items-center justify-center p-2 gap-1 border-r border-dashed border-gray-300 rotate-180">
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
                    size="lg"
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold text-base px-8 shadow-lg"
                  >
                    <Printer className="size-5" />
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
          {/* Sticker print (3x3 inch) */}
          {printMode === 'sticker' && (
            <div className="hidden print:flex print:items-start print:justify-start print:p-0 print:m-0">
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
                }}
              >
                <StickerFace
                  lightningUri={lightningUri}
                  address={generatedAddress}
                  qrSize={384}
                  imgWidth="1.6in"
                  badgeWidth="1.6in"
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
                    imgWidth="1.8in"
                    badgeWidth="1.8in"
                    fontSize="6pt"
                  />
                </div>

                {/* Panel 2: Back face (upside-down) */}
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
                    transform: 'rotate(180deg)',
                  }}
                >
                  <StickerFace
                    lightningUri={lightningUri}
                    address={generatedAddress}
                    qrSize={384}
                    imgWidth="1.8in"
                    badgeWidth="1.8in"
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
    </div>
  );
};

export default Index;
