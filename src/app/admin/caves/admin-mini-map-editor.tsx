
'use client';

import { useState } from 'react';
import { CaveMiniMap } from '@/lib/types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminMiniMapEditor({
  caveId,
  initialMap,
}: {
  caveId: string;
  initialMap: CaveMiniMap;
}) {
  const db = useFirestore();
  const { toast } = useToast();
  const [map, setMap] = useState(initialMap);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        await updateDoc(doc(db, 'caveMaps', caveId), {
            nodes: map.nodes,
            edges: map.edges, // make sure edges are saved too
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Berhasil", description: "Tata letak peta mini telah disimpan." });
    } catch(e) {
        console.error("Failed to save minimap", e);
        toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan peta mini." });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="bg-card rounded-xl p-4 border mt-6">
      <h3 className="font-bold mb-2">🗺️ Editor Mini-Map</h3>

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
                />
                 <text x={n.x + 3} y={n.y + 1.5} fontSize="3" fill="hsl(var(--foreground))" className='pointer-events-none'>
                    {n.label}
                </text>
            </g>
            ))}
        </svg>
      </div>

      <Button
        onClick={saveMap}
        className="mt-3"
        disabled={isSaving}
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        💾 Simpan Mini-Map
      </Button>
    </div>
  );
}
