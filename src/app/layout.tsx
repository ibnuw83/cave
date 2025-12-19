
import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { getKioskSettings } from '@/lib/firestore';
import Footer from '@/app/components/footer';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getKioskSettings();
  const logoUrl = settings?.logoUrl;

  const defaultTitle = 'Penjelajah Gua 4D';
  const defaultDescription = 'Pengalaman 4D digital menjelajahi gua Indonesia';

  return {
    title: defaultTitle,
    description: defaultDescription,
    icons: {
      icon: logoUrl || '/favicon.ico',
      shortcut: logoUrl || '/favicon.ico',
      apple: logoUrl || '/favicon.ico',
    },
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: '#2A2B32',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Rye&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2A2B32" />
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
