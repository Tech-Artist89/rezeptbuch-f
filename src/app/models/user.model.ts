// src/app/models/user.model.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface UserProfile {
  id: number;
  user: User;
  bio: string;
  avatar?: string;
  default_servings: number;
  created_at: string;
}

export interface UserProfileUpdate {
  bio?: string;
  avatar?: File | string;
  default_servings?: number;
}