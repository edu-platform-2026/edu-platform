export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  institutionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
