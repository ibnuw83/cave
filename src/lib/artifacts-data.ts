import { Artifact } from './types';

// This is the master list of all discoverable artifacts in the game.
export const ALL_ARTIFACTS: Artifact[] = [
    {
        id: 'crystal-of-light',
        caveId: 'jomblang',
        spotId: 'cahaya-surga', // Match the spot ID where it's hidden
        name: 'Kristal Cahaya',
        description: 'Sebuah kristal yang memancarkan cahaya surgawi, ditemukan di jantung Gua Jomblang.',
        imageUrl: 'https://picsum.photos/seed/crystal/400/400'
    },
    {
        id: 'echo-stone',
        caveId: 'gong',
        spotId: 'stalaktit-raksasa', // Match the spot ID
        name: 'Batu Gema',
        description: 'Batu yang beresonansi dengan suara tetesan air di Gua Gong.',
        imageUrl: 'https://picsum.photos/seed/stone/400/400'
    },
    {
        id: 'fossilized-leaf',
        caveId: 'petruk',
        spotId: 'sendang-suci',
        name: 'Fosil Daun Purba',
        description: 'Jejak kehidupan dari jutaan tahun lalu, terawetkan sempurna di dalam batu.',
        imageUrl: 'https://picsum.photos/seed/fossil/400/400'
    },
    {
        id: 'ancient-hand-print',
        caveId: 'petruk',
        spotId: 'tangan-dewa',
        name: 'Jejak Tangan Purba',
        description: 'Lukisan telapak tangan misterius yang ditinggalkan oleh penghuni gua ribuan tahun lalu.',
        imageUrl: 'https://picsum.photos/seed/handprint/400/400'
    },
    {
        id: 'river-gem',
        caveId: 'jomblang',
        spotId: 'sungai-bawah-tanah',
        name: 'Permata Sungai',
        description: 'Batu mulia yang terkikis halus oleh aliran sungai bawah tanah yang deras.',
        imageUrl: 'https://picsum.photos/seed/gem/400/400'
    },
    {
        id: 'permata-tersembunyi', // ID unik untuk artefak ini
        caveId: 'gua-baru', // ID gua tempat spot berada
        spotId: 'ruang-kristal-123', // PENTING: ID spot tempat artefak disembunyikan
        name: 'Permata Tersembunyi',
        description: 'Sebuah permata langka yang berkilau dalam kegelapan Ruang Kristal.',
        imageUrl: 'https://picsum.photos/seed/newgem/400/400' // URL gambar untuk artefak
    }
];
