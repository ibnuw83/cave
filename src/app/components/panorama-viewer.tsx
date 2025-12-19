'use client';

import { useRef, useEffect } from 'react';

// Fungsi untuk memastikan nilai berada dalam rentang min/max
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export default function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Diperlukan jika gambar berasal dari domain lain
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      requestAnimationFrame(draw);
    };
  }, [imageUrl]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;

    if (!canvas || !ctx || !image) return;
    
    // Atur ukuran canvas sesuai dengan parent, tapi pertahankan rasio aspek gambar
    const parent = canvas.parentElement;
    if(parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Hitung pergeseran x berdasarkan rotasi y
    const imageWidth = image.width;
    const dx = (rotation.current.y % imageWidth);

    // Gambar gambar dua kali untuk efek loop
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, dx, 0, imageWidth, canvasHeight);
    ctx.drawImage(image, dx - imageWidth, 0, imageWidth, canvasHeight);
    if (dx > 0) {
      ctx.drawImage(image, dx - imageWidth, 0, imageWidth, canvasHeight);
    } else {
       ctx.drawImage(image, dx + imageWidth, 0, imageWidth, canvasHeight);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    
    rotation.current.y += deltaX * 0.5; // Sesuaikan kecepatan geser

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    requestAnimationFrame(draw);
  };

  useEffect(() => {
    const handleResize = () => requestAnimationFrame(draw);
    window.addEventListener('resize', handleResize);
    // Gambar awal
    requestAnimationFrame(draw);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    />
  );
}
