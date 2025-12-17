import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
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
  id: string;
  caveId: string;
  order: number;
  title: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  isPro: boolean;
  effects?: {
    vibrationPattern?: number[];
  };
}
