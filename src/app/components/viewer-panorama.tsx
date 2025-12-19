'use client';

import { useEffect, useRef, ReactNode } from 'react';
import * as THREE from 'three';

export default function PanoramaViewer({
  imageUrl,
  children,
}: {
  imageUrl: string;
  children?: ReactNode;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // === BASIC SETUP ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // === SPHERE ===
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // INSIDE SPHERE

    const texture = new THREE.TextureLoader().load(imageUrl);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // === ORBIT CONTROL (SIMPLE) ===
    let isDown = false;
    let lon = 0;
    let lat = 0;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      lon += (e.clientX - lastX) * 0.1;
      lat += (e.clientY - lastY) * 0.1;
      lat = Math.max(-85, Math.min(85, lat));
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseUp = () => (isDown = false);
    
    // === ZOOM CONTROL ===
    let fov = 75;
    const MIN_FOV = 30;
    const MAX_FOV = 100;
    
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        fov += e.deltaY * 0.05;
        fov = Math.max(MIN_FOV, Math.min(MAX_FOV, fov));
        camera.fov = fov;
        camera.updateProjectionMatrix();
    };


    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // === RENDER LOOP ===
    const animate = () => {
      requestAnimationFrame(animate);

      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      camera.lookAt(
        new THREE.Vector3(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        )
      );

      renderer.render(scene, camera);
    };

    animate();
    
     // Handle window resize
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);


    // === CLEANUP ===
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if(mountRef.current && renderer.domElement){
          mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      {children}
    </div>
  );
}
