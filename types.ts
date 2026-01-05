
export interface Milestone {
  temperature: string;
  time: string; // MM:SS format
}

export interface RoastingData {
  chargeTemperature: string;
  turningWhite: Milestone;
  yellowingPoint: Milestone;
  firstCrack: Milestone;
  dropBean: Milestone;
  totalTime: string; // MM:SS format
}

export interface Batch {
  id: string;
  roastDate: string;
  chargeWeight: number; // grams
  plan: RoastingData;
  actual: RoastingData;
  roastingNotes?: string;
  tastingNotes?: string;
  imageUrl?: string; 
}

export interface GreenBean {
  id: string;
  userId: string;
  country: string; // Primary geographic identifier (Required)
  beanName: string;
  cultivar?: string;
  estateFarm?: string;
  processMethod: string;
  masl: string;
  waterActivity: string;
  density: string;
  cuppingNotes?: string;
  roastRecommendation?: string;
  isPublic: boolean;
  batches: Batch[];
  createdAt: string;
  imageUrl?: string; 
}

export interface User {
  id: string;
  username: string;
  password?: string;
  isAuthenticated: boolean;
  tempUnit: 'C' | 'F';
}

export interface CloudConfig {
  enabled: boolean;
  provider: 'supabase' | 'custom';
  url: string;
  apiKey: string;
  lastSync?: string;
}

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error';

export interface AppState {
  currentUser: User | null;
  users: User[];
  beans: GreenBean[];
  cloudConfig: CloudConfig;
}
