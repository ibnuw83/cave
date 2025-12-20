'use client';

import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'free' | 'pro1' | 'pro2' | 'pro3' | 'vip' | 'admin';
  updatedAt: Timestamp;
}

export interface Location {
  id: string;
  name: string;
  category: string;
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
  locationId: string;
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

export interface OfflineLocationData {
    location: Location;
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

export interface PaymentGatewaySettings {
    provider: 'midtrans' | 'xendit' | 'none';
    mode: 'sandbox' | 'production';
    clientKey?: string;
    serverKey?: string;
}

export interface KioskSettings {
  id: string; // Should be a singleton, e.g., 'main'
  locationId: string;
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
  paymentGateway?: PaymentGatewaySettings;
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

export interface PricingTier {
  id: string; // Corresponds to user role, e.g., 'pro1', 'vip'
  name: string;
  price: string;
  priceDescription: string;
  features: string[];
  isPopular: boolean;
  cta: string;
  order: number;
}
