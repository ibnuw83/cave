import { CaveMiniMap } from '@/lib/types';

export const petrukMiniMap: CaveMiniMap = {
  nodes: [
    { id: 'spot-1', label: 'Mulut Goa', x: 12, y: 55 },
    { id: 'spot-2', label: 'Lorong', x: 45, y: 50 }
  ],
  edges: [
    { from: 'spot-1', to: 'spot-2' }
  ],
};
