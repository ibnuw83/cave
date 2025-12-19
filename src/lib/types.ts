'use client';

import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'free' | 'pro' | 'admin';
  updatedAt: Timestamp;
}

export interface Cave {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  isActive: boolean;
}

export type Hotspot = {
  id: string;
  label: string;
  position: [number, number, number]; // posisi 3D di sphere
  targetSpotId: string;
};

export interface Spot {
  id:string;
  caveId: string;
  order: number;
  title: string;
  description: string;
  imageUrl: string;
  isPro: boolean;
  viewType: 'auto' | 'flat' | 'panorama';
  effects?: {
    vibrationPattern?: number[];
  };
  hotspots?: Hotspot[];
}

export interface Artifact {
  id: string;
  caveId: string;
  spotId: string; // The spot where this artifact is hidden
  name: string;
  description: string;
  imageUrl: string;
}

export interface UserArtifact {
  id: string; // artifactId
  userId: string;
  caveId: string;
  foundAt: Timestamp;
}


export interface OfflineCaveData {
    cave: Cave;
    spots: Spot[];
    timestamp: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: any;
  photoURL?: string;
}

export interface KioskPlaylistItem {
  spotId: string;
  duration: number; // in seconds
}

export interface KioskSettings {
  id: string; // Should be a singleton, e.g., 'main'
  caveId: string;
  playlist: KioskPlaylistItem[];
  mode: 'loop' | 'shuffle';
  exitPin: string;
  logoUrl?: string;
  footerText?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  mainTitle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}

export type CaveMapNode = {
  id: string;          // spotId
  label: string;
  x: number;           // posisi relatif (0–100)
  y: number;
};

export type CaveMapEdge = {
  from: string;
  to: string;
};

export type CaveMiniMap = {
  nodes: CaveMapNode[];
  edges: CaveMapEdge[];
};
