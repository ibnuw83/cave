'use client';

import type { Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { useEffect } from 'react';
import Footer from '@/app/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    // This is a client-side effect to update metadata
    async function setMetadata() {
        // Since getKioskSettings is client-side, we can call it here.
        // But for simplicity and to avoid fetching data just for a favicon,
        // we might rely on a static one or handle it differently.
        // For now, let's just log a message.
        console.log("RootLayout mounted, can fetch client-side data here.");
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
