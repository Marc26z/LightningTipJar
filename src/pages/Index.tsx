import { useSeoMeta } from '@unhead/react';
import { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from '@/components/ui/qrcode';
import { Printer, Zap } from 'lucide-react';

const TIPJAR_IMAGE = 'https://blossom.primal.net/9f7debc14b9df626afbf261c69586e19c98470bc4f47c0e5b969af9a825704d1.png';
const BITCOIN_BADGE = 'https://blossom.dreamith.to/6aaee5d7b3ef908f0662759a1053466a8d378c86eafee216bb477b0252983bc9.png';

const Index = () => {
  useSeoMeta({
    title: 'Zap Jar — Lightning Tip Jar Sticker Generator',
    description: 'Generate a printable 3x3 inch sticker with a QR code for your Lightning address. Stick it on a tip jar and start receiving zaps!',
  });

  const [address, setAddress] = useState('');
  const [generatedAddress, setGeneratedAddress] = useState('');
  const stickerRef = useRef<HTMLDivElement>(null);

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
    window.print();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-950 dark:to-gray-900">
      {/* Screen-only UI */}
      <div className="print:hidden">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              ⚡Lightning Tip Jar ⚡
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Generate a printable sticker with a QR code for your Lightning tip jar
            </p>
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-amber-100 dark:border-gray-700">
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
              Enter your Lightning address (e.g. name@walletofstoshi.com)
            </p>
          </div>

          {/* Sticker Preview */}
          {generatedAddress && (
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Sticker Preview
              </h2>

              {/* The sticker at screen size */}
              <div className="bg-white rounded-2xl shadow-2xl p-1 border-2 border-dashed border-gray-300">
                <div className="sticker-preview w-[288px] h-[288px] bg-white rounded-xl flex flex-col items-center justify-center p-3 gap-1.5 relative overflow-hidden">
                  {/* TipJar image at top */}
                  <img
                    src={TIPJAR_IMAGE}
                    alt="Tip Jar"
                    className="w-[160px] h-auto object-contain shrink-0"
                    crossOrigin="anonymous"
                  />

                  {/* QR Code */}
                  <div className="flex-1 flex items-center justify-center">
                    <QRCodeCanvas
                      value={lightningUri}
                      size={140}
                      level="M"
                      className="rounded-lg"
                    />
                  </div>

                  {/* Bitcoin Lightning Accepted badge */}
                  <img
                    src={BITCOIN_BADGE}
                    alt="Bitcoin Lightning Accepted Here"
                    className="w-[150px] h-auto object-contain shrink-0"
                    crossOrigin="anonymous"
                  />

                  {/* Lightning address at bottom */}
                  <p className="text-[8px] text-gray-500 font-mono tracking-tight leading-none truncate max-w-full shrink-0">
                    {generatedAddress}
                  </p>
                </div>
              </div>

              {/* Print Button */}
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

      {/* Print-only: the exact 3x3 inch sticker */}
      {generatedAddress && (
        <div ref={stickerRef} className="hidden print:flex print:items-start print:justify-start print:p-0 print:m-0">
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
            {/* TipJar image */}
            <img
              src={TIPJAR_IMAGE}
              alt="Tip Jar"
              crossOrigin="anonymous"
              style={{
                width: '1.6in',
                height: 'auto',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />

            {/* QR Code */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QRCodeCanvas
                value={lightningUri}
                size={384}
                level="M"
              />
            </div>

            {/* Bitcoin Lightning Accepted badge */}
            <img
              src={BITCOIN_BADGE}
              alt="Bitcoin Lightning Accepted Here"
              crossOrigin="anonymous"
              style={{
                width: '1.6in',
                height: 'auto',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />

            {/* Address */}
            <p
              style={{
                fontSize: '6pt',
                color: '#666',
                fontFamily: 'monospace',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                margin: 0,
                flexShrink: 0,
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {generatedAddress}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
