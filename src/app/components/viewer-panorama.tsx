
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
  const lastTouchDistance = useRef<number | null>(null);

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

    // === MOUSE/TOUCH/GYRO CONTROLS ===
    let isDown = false;
    let lon = 0;
    let lat = 0;
    let lastX = 0;
    let lastY = 0;

    // The initial device orientation
    let initialDeviceAlpha: number | null = null;
    let initialDeviceBeta: number | null = null;

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
    
    // === ZOOM CONTROL (WHEEL & PINCH) ===
    const MIN_FOV = 30;
    const MAX_FOV = 100;
    
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        camera.fov += e.deltaY * 0.05;
        camera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, camera.fov));
        camera.updateProjectionMatrix();
    };

    const getDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchMove = (e: TouchEvent) => {
      // Handle dragging
      if (e.touches.length === 1) {
          if (!isDown) return;
          const touch = e.touches[0];
          lon += (touch.clientX - lastX) * 0.1;
          lat += (touch.clientY - lastY) * 0.1;
          lat = Math.max(-85, Math.min(85, lat));
          lastX = touch.clientX;
          lastY = touch.clientY;
      }
      
      // Handle pinching
      if (e.touches.length !== 2) return;

      e.preventDefault(); 

      const distance = getDistance(e.touches[0], e.touches[1]);

      if (lastTouchDistance.current !== null) {
        const delta = lastTouchDistance.current - distance;

        camera.fov += delta * 0.1; // Pinch sensitivity
        camera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, camera.fov));
        camera.updateProjectionMatrix();
      }

      lastTouchDistance.current = distance;
    };
    
    const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            isDown = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    };

    const onTouchEnd = () => {
      isDown = false;
      lastTouchDistance.current = null;
    };

    // --- GYROSCOPE ---
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (!e.alpha || !e.beta) {
        return;
      }

      // `alpha` is the compass direction, which we use for horizontal rotation (lon).
      // `beta` is the front-to-back tilt, for vertical rotation (lat).
      
      // Set the initial orientation on the first event.
      if (initialDeviceAlpha === null) {
        initialDeviceAlpha = e.alpha;
        initialDeviceBeta = e.beta;
      }

      // Calculate the change from the initial orientation.
      const deltaAlpha = e.alpha - initialDeviceAlpha;
      const deltaBeta = e.beta - initialDeviceBeta;
      
      lon = deltaAlpha;
      lat = deltaBeta * 0.5; // Reduce vertical sensitivity
      lat = Math.max(-85, Math.min(85, lat)); // Clamp latitude
    };


    // === EVENT LISTENERS ===
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    window.addEventListener('deviceorientation', onDeviceOrientation);


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
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
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
