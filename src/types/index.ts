export interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  clinicId?: string;
  clinicName?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
} 