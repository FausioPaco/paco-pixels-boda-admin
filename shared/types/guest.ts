export interface Guest {
  id: number;
  localId: number;
  name: string;
  phone: string;
  people_Count: number;
  presence_Confirmed: boolean;
  arrived: boolean;
  eventId?: number;
  eventName?: string;
  deskId: number;
  deskName?: string;
  categoryId?: number;
  categoryName: string;
  people_Confirmed?: number;
  additional_Comments?: string;
  seatNumber?: number;
  absence_Declared?: boolean;
  absence_Declared_At?: string | Date | null;
  created_At: Date;
}

export interface GuestParameters {
  eventId?: number;
  guestId?: number;
  guestLocalId?: number;
  categoryId?: number;
  availability_Type: string;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}

export interface GuestInput {
  eventId?: number;
  people_Count: number;
  deskId?: number;
  name: string;
  phone: string;
  categoryId: number;
}

export interface GuestCategory {
  id: number;
  name: string;
}

export interface ConfirmPresenceInput {
  peopleConfirmed: number;
  additional_Comments?: string;
}

export type ExportFormat = 'png' | 'pdf';
export type ExportTextColor = 'black' | 'white';
export type ExportListFormat = 'excel' | 'pdf';

export type ExportQROptions = {
  format: ExportFormat;
  color: ExportTextColor;
};

export interface DeclareAbsenceInput {
  additional_Comments?: string;
}
