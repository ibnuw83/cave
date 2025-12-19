'use client';

import { CaveMiniMap } from '@/lib/types';

export function MiniMapHeat({
  map,
  stats,
  activeSpotId,
}: {
  map: CaveMiniMap;
  stats: Record<string, number>;
  activeSpotId: string;
}) {
  const max = Math.max(...Object.values(stats), 1);

  function heatColor(value = 0) {
    const t = value / max;
    // from yellow to red
    return `rgba(255, ${200 - t * 150}, 0, 0.9)`;
  }

  return (
    <svg viewBox="0 0 100 100" width="180" height="180">
      {/* edges */}
      {map.edges.map((e, i) => {
        const a = map.nodes.find(n => n.id === e.from);
        const b = map.nodes.find(n => n.id === e.to);
        if (!a || !b) return null;

        const heat =
          ((stats[e.from] || 0) + (stats[e.to] || 0)) / 2;

        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={heatColor(heat)}
            strokeWidth={2}
          />
        );
      })}

      {/* nodes */}
      {map.nodes.map(n => (
        <circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r={n.id === activeSpotId ? 5 : 3}
          fill={heatColor(stats[n.id] || 0)}
        />
      ))}
    </svg>
  );
}
