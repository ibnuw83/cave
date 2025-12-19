
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getKioskSettings } from '@/lib/firestore';
import { KioskSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function Footer() {
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKioskSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const footerText = settings?.footerText
    ? settings.footerText.replace('{tahun}', new Date().getFullYear().toString())
    : `© ${new Date().getFullYear()} Penjelajah Gua. All rights reserved.`;

  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {loading ? (
             <Skeleton className="h-5 w-64" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {footerText}
            </p>
          )}
          <div className="flex items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </>
            ) : (
              <>
                {settings?.twitterUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted-foreground transition-colors hover:text-sky-500">
                      <Twitter className="h-6 w-6" />
                    </Link>
                  </Button>
                )}
                {settings?.instagramUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground transition-colors hover:text-pink-500">
                      <Instagram className="h-6 w-6" />
                    </Link>
                  </Button>
                )}
                {settings?.facebookUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground transition-colors hover:text-blue-600">
                      <Facebook className="h-6 w-6" />
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
