'use client';

/**
 * Menganalisis URL gambar untuk menentukan tipe tampilan yang paling sesuai
 * berdasarkan rasio aspeknya.
 * @param imageUrl URL dari gambar yang akan dianalisis.
 * @returns Promise yang akan resolve menjadi 'flat', 'panorama', atau 'full360'.
 */
export async function detectViewType(imageUrl: string): Promise<'flat' | 'panorama' | 'full360'> {
  // Karena kita berada di lingkungan Next.js, pastikan kode ini hanya berjalan di sisi klien
  if (typeof window === 'undefined') {
    return 'flat';
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const ratio = img.width / img.height;
      
      // Rasio 2:1 atau lebih lebar biasanya adalah gambar panorama.
      // Rasio 2.8:1 atau lebih bisa dianggap sebagai full 360, meskipun 2:1 adalah standar equirectangular.
      // Threshold ini bisa disesuaikan.
      if (ratio >= 2.8) {
        resolve('full360');
      } else if (ratio >= 1.9) { // Sedikit toleransi di bawah 2.0
        resolve('panorama');
      } else {
        resolve('flat');
      }
    };
    
    img.onerror = () => {
      // Jika gambar gagal dimuat, anggap sebagai 'flat' untuk menghindari error.
      console.warn(`Gagal memuat gambar untuk deteksi viewType: ${imageUrl}`);
      resolve('flat');
    };
    
    img.src = imageUrl;
  });
}
