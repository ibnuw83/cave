'use client';

import type { Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseProvider } from '@/firebase/provider'; // Diubah untuk menggunakan provider tunggal
import { useEffect } from 'react';
import Script from 'next/script';
import Footer from '@/app/components/footer';
import { getKioskSettings } from '@/lib/firestore';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

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
        } catch (error) {
            console.warn("Could not fetch kiosk settings for favicon:", error);
        }
    }
    setMetadata();
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <title>Penjelajah Gua 4D</title>
        <meta name="description" content="Pengalaman 4D digital menjelajahi gua Indonesia" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Rye&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2A2B32" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=YOUR_ADSENSE_CLIENT_ID"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
