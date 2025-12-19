
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Providers } from './providers';
import { getKioskSettings } from '@/lib/firestore';
import "pannellum/build/pannellum.css";

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
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Providers>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
