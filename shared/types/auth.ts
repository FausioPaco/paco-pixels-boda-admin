import type { User } from './user';

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expirationMinutes: number;
}
