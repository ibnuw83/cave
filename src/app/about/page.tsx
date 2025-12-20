import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Halaman Utama
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Tentang Cave Explorer 4D</h1>
        <p className="mt-2 text-lg text-muted-foreground">Menghadirkan keajaiban dunia bawah tanah ke ujung jari Anda.</p>
      </header>
      <main className="prose prose-invert lg:prose-xl max-w-none">
        <p>
          Cave Explorer 4D lahir dari hasrat untuk petualangan dan kecintaan terhadap teknologi. Kami percaya bahwa setiap orang harus memiliki kesempatan untuk merasakan keindahan dan misteri gua-gua paling spektakuler di dunia, terlepas dari lokasi atau keterbatasan fisik.
        </p>
        <p>
          Misi kami adalah menciptakan pengalaman digital yang begitu nyata dan imersif, seolah-olah Anda benar-benar berada di sana. Dengan menggabungkan fotografi panorama 360 derajat berkualitas tinggi, narasi audio yang mendalam, dan efek haptic yang canggih, kami membawa sensasi penjelajahan gua—suara tetesan air, getaran langkah kaki, dan suasana magis—langsung ke perangkat Anda.
        </p>
        <h2 className="text-2xl font-semibold text-primary mt-8">Visi Kami</h2>
        <p>
          Kami bercita-cita menjadi platform tur virtual terdepan untuk situs-situs geologis dan bersejarah di seluruh dunia. Kami ingin menginspirasi rasa ingin tahu, mempromosikan pendidikan tentang geologi, dan mendukung upaya konservasi dengan meningkatkan kesadaran akan keindahan alam yang rapuh ini.
        </p>
        <p>
          Terima kasih telah bergabung dengan kami dalam petualangan ini.
        </p>
      </main>
    </div>
  );
}
