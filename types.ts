export enum UserType {
  ADULT = 'Adult',
  KID = 'Kid'
}

export interface User {
  id: string;
  name: string;
  type: UserType;
  createdAt: number;
}

export interface FeverRecord {
  id: string;
  userId: string;
  temperature: number;
  timestamp: number;
  notes?: string;
}

export interface Prescription {
  id: string;
  userId: string;
  illness: string;
  medicineName: string;
  dosage: string;
  prescribedBy: string;
  isActive: boolean;
  timestamp: number;
  notes?: string;
}

export type ViewState = 'HOME' | 'USER_PROFILE';

export type TabState = 'FEVER';