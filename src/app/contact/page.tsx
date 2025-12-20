import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Halaman Utama
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Hubungi Kami</h1>
        <p className="mt-2 text-lg text-muted-foreground">Kami senang mendengar dari Anda. Sampaikan pertanyaan atau masukan Anda.</p>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <a href="mailto:support@caveexplorer4d.com" className="text-muted-foreground hover:text-primary">
                  support@caveexplorer4d.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Telepon</h3>
                <p className="text-muted-foreground">(+62) 123-456-7890</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
