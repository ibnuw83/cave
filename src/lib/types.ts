
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
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

export interface Spot {
  id:string;
  caveId: string;
  order: number;
  title: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  isPro: boolean;
  viewType?: 'flat';
  effects?: {
    vibrationPattern?: number[];
  };
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
}

    
