
'use client';

import { useState, useEffect } from 'react';
import { Location } from '@/lib/types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminMiniMapEditor({
  locationId,
  initialMap,
}: {
  locationId: string;
  initialMap: Location['miniMap'];
}) {
  const db = useFirestore();
  const { toast } = useToast();
  const [map, setMap] = useState<Location['miniMap']>(
    initialMap ?? { nodes: [], edges: [] }
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Debounced auto-save effect
    const handler = setTimeout(() => {
      // Don't save on initial render
      if (JSON.stringify(map) !== JSON.stringify(initialMap ?? { nodes: [], edges: [] })) {
        saveMap();
      }
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [map]);


  function updateNode(id: string, x: number, y: number) {
    setMap(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === id ? { ...n, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : n
      ),
    }));
  }

  async function saveMap() {
    setIsSaving(true);
    try {
        await updateDoc(doc(db, 'locations', locationId), {
            'miniMap.nodes': map.nodes,
            'miniMap.edges': map.edges,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Tersimpan Otomatis", description: "Tata letak peta mini telah diperbarui." });
    } catch(e) {
        console.error("Failed to auto-save minimap", e);
        toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Gagal menyimpan peta mini." });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="bg-card rounded-xl p-4 border mt-6">
       <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">🗺️ Editor Mini-Map</h3>
            {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                </div>
            )}
       </div>

      <div className='relative'>
        <svg
            viewBox="0 0 100 100"
            className="w-full h-80 border rounded-md bg-muted/20"
            onMouseUp={() => setDragId(null)}
            onMouseLeave={() => setDragId(null)}
            onMouseMove={e => {
                if (!dragId) return;
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                updateNode(dragId, x, y);
            }}
            onTouchMove={e => {
              if (!dragId) return;
              const touch = e.touches[0];
              const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
              const x = ((touch.clientX - rect.left) / rect.width) * 100;
              const y = ((touch.clientY - rect.top) / rect.height) * 100;
              updateNode(dragId, x, y);
            }}
            onTouchEnd={() => setDragId(null)}
        >
            {/* edges */}
            {map.edges.map((e, i) => {
            const a = map.nodes.find(n => n.id === e.from);
            const b = map.nodes.find(n => n.id === e.to);
            if (!a || !b) return null;
            return (
                <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                />
            );
            })}

            {/* nodes */}
            {map.nodes.map(n => (
            <g key={n.id}>
                <circle
                    cx={n.x}
                    cy={n.y}
                    r={2.5}
                    fill="hsl(var(--primary))"
                    className="cursor-move"
                    onMouseDown={() => setDragId(n.id)}
                    onTouchStart={() => setDragId(n.id)}
                />
                 <text x={n.x + 3} y={n.y + 1.5} fontSize="3" fill="hsl(var(--foreground))" className='pointer-events-none'>
                    {n.label}
                </text>
            </g>
            ))}
        </svg>
      </div>
    </div>
  );
}
