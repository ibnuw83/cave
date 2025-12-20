import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Halaman Utama
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Kebijakan Privasi</h1>
        <p className="mt-2 text-lg text-muted-foreground">Terakhir diperbarui: 24 Juli 2024</p>
      </header>
      <main className="prose prose-invert lg:prose-xl max-w-none">
        <p>
          Selamat datang di Cave Explorer 4D. Kami menghargai privasi Anda dan berkomitmen untuk melindunginya. Kebijakan Privasi ini menjelaskan jenis informasi yang kami kumpulkan dari Anda, bagaimana kami menggunakannya, dan langkah-langkah yang kami ambil untuk melindunginya.
        </p>

        <h2 className="text-2xl font-semibold text-primary mt-8">1. Informasi yang Kami Kumpulkan</h2>
        <p>
          Kami mengumpulkan informasi berikut untuk menyediakan dan meningkatkan layanan kami:
        </p>
        <ul>
          <li><strong>Informasi Akun:</strong> Saat Anda mendaftar, kami mengumpulkan nama tampilan, alamat email, dan kata sandi Anda. Jika Anda masuk menggunakan penyedia pihak ketiga, kami menerima informasi profil dasar dari mereka.</li>
          <li><strong>Data Penggunaan:</strong> Kami dapat mengumpulkan informasi tentang bagaimana Anda berinteraksi dengan aplikasi, seperti lokasi yang Anda jelajahi dan fitur yang Anda gunakan, untuk meningkatkan pengalaman pengguna.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-primary mt-8">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
        <p>
          Informasi yang kami kumpulkan digunakan untuk tujuan berikut:
        </p>
        <ul>
          <li>Untuk menyediakan, memelihara, dan meningkatkan fungsionalitas aplikasi.</li>
          <li>Untuk mempersonalisasi pengalaman Anda, seperti mengelola akses ke konten PRO.</li>
          <li>Untuk berkomunikasi dengan Anda mengenai pembaruan atau informasi terkait akun.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-primary mt-8">3. Keamanan Data</h2>
        <p>
          Kami menggunakan Firebase Authentication dan Firestore Security Rules untuk melindungi data Anda dari akses yang tidak sah. Kami mengambil langkah-langkah yang wajar untuk memastikan keamanan informasi pribadi Anda.
        </p>

        <h2 className="text-2xl font-semibold text-primary mt-8">4. Pihak Ketiga</h2>
        <p>
          Kami dapat menggunakan layanan pihak ketiga seperti Google AdSense untuk menampilkan iklan. Layanan ini dapat mengumpulkan data penggunaan secara anonim sesuai dengan kebijakan privasi mereka sendiri. Kami tidak membagikan informasi pribadi Anda dengan pengiklan.
        </p>

        <h2 className="text-2xl font-semibold text-primary mt-8">5. Perubahan pada Kebijakan Ini</h2>
        <p>
          Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan apa pun dengan memposting kebijakan baru di halaman ini. Anda disarankan untuk meninjau Kebijakan Privasi ini secara berkala.
        </p>
        
        <h2 className="text-2xl font-semibold text-primary mt-8">6. Hubungi Kami</h2>
        <p>
          Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui halaman <Link href="/contact">kontak</Link> kami.
        </p>
      </main>
    </div>
  );
}
