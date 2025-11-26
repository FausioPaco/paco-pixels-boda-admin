export type User = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  partnerId?: number;
  profileImageUrl?: string | null;
  lastLoginAt?: string | Date | null;
  lastActivityAt?: string | Date | null;
  isOnline?: boolean;
  created_At: Date;
};

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  roleId: number;
  eventId?: number;
}

export interface PasswordInput {
  newPassword: string;
}

export interface UserParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}

export type Role = {
  id: number;
  name: string;
};
