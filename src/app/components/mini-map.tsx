
'use client';

import { CaveMiniMap } from '@/lib/types';

export function MiniMap({
  map,
  activeSpotId,
  onNavigate,
}: {
  map: CaveMiniMap;
  activeSpotId: string;
  onNavigate: (spotId: string) => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-50 bg-black/70 rounded-lg p-3 text-white">
      <svg width="180" height="180" viewBox="0 0 100 100">
        
        {/* EDGES */}
        {map.edges.map((e, i) => {
          const from = map.nodes.find(n => n.id === e.from);
          const to = map.nodes.find(n => n.id === e.to);
          if (!from || !to) return null;

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#666"
              strokeWidth="2"
            />
          );
        })}

        {/* NODES */}
        {map.nodes.map(node => {
          const isActive = node.id === activeSpotId;

          return (
            <g
              key={node.id}
              onClick={() => onNavigate(node.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive ? 4.5 : 3}
                fill={isActive ? '#00ffff' : '#ffffff'}
              />
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={7}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="text-xs text-center mt-2 opacity-70">
        Mini Map Jalur Gua
      </div>
    </div>
  );
}
