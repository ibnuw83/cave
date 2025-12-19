import { CaveMiniMap } from '@/lib/types';

export const petrukMiniMap: CaveMiniMap = {
  nodes: [
    { id: 'spot-1', label: 'Mulut Goa', x: 10, y: 50 },
    { id: 'spot-2', label: 'Lorong Utama', x: 40, y: 50 },
    { id: 'spot-3', label: 'Ruang Tengah', x: 70, y: 30 },
    { id: 'spot-4', label: 'Kolam', x: 70, y: 70 },
  ],
  edges: [
    { from: 'spot-1', to: 'spot-2' },
    { from: 'spot-2', to: 'spot-3' },
    { from: 'spot-2', to: 'spot-4' },
  ],
};
