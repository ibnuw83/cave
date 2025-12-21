'use client';

import type { Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import Footer from '@/app/components/footer';
import { getKioskSettings } from '@/lib/firestore-client';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [adsenseClientId, setAdsenseClientId] = useState<string | null>(null);

  useEffect(() => {
    // This is a client-side effect to update metadata
    async function setMetadata() {
        try {
            const settings = await getKioskSettings();
            if (settings?.logoUrl) {
                let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!favicon) {
                    favicon = document.createElement('link');
                    favicon.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(favicon);
                }
                favicon.href = settings.logoUrl;
            }
            if (settings?.adsense?.clientId) {
                setAdsenseClientId(settings.adsense.clientId);
            }
        } catch (error) {
            console.warn("Could not fetch kiosk settings for metadata:", error);
        }
    }
    setMetadata();
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Rye&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2A2B32" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {adsenseClientId && (
            <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
            />
        )}
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
