import type { Guest } from './guest';

export interface Desk {
  id: number;
  name: string;
  seats_Filled: number;
  seats_Limit: number;
  eventId?: number;
  eventName: string;
  guests: Guest[];
}

export interface DeskParameters {
  eventId?: number | string;
  availability_Type: string;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}

export interface DeskInput {
  name: string;
  seats_Limit: number;
  eventId?: number;
}

export interface DeskOption {
  id: number;
  name: string;
}

export type DeskSeatingSnapshotGuest = {
  id: number;
  name: string;
  people_Count: number;
  seatNumber: number | null;
};

export type DeskSeatingSnapshotDesk = {
  id: number;
  name: string;
  seats_Limit: number;
  seats_Filled: number;
  guests: DeskSeatingSnapshotGuest[];
};

export type DeskSeatingSnapshot = DeskSeatingSnapshotDesk[];
