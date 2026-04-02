export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}
