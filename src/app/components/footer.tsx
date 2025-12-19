'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Penjelajah Gua. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground transition-colors hover:text-sky-500">
                <Twitter className="h-6 w-6" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground transition-colors hover:text-pink-500">
                <Instagram className="h-6 w-6" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="Facebook" className="text-muted-foreground transition-colors hover:text-blue-600">
                <Facebook className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
