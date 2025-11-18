import type { User } from './user';

export interface UserLoginInput {
  email: string;
  password: string;
  context?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expirationMinutes: number;
}
