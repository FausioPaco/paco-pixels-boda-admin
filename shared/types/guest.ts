export type GuestWhatsAppQrStatus =
  | 'not_sent'
  | 'pending'
  | 'accepted'
  | 'delivered'
  | 'seen'
  | 'invalid_phone'
  | 'failed_temporary'
  | 'failed'
  | 'delivery_unknown'
  | 'needs_review';

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
  gift_Brought?: boolean | null;
  absence_Declared?: boolean;
  absence_Declared_At?: string | Date | null;
  created_At: Date;
  hasWhatsAppQrSent?: boolean;
  hasWhatsAppQrDelivered?: boolean;
  hasWhatsAppQrSeen?: boolean;
  whatsAppQrStatus?: GuestWhatsAppQrStatus;
  whatsAppQrStatusLabel?: string;

  whatsAppQrSentAt?: string | Date | null;

  whatsAppQrAcceptedAt?: string | Date | null;
  whatsAppQrDeliveredAt?: string | Date | null;
  whatsAppQrSeenAt?: string | Date | null;

  whatsAppQrLastAttemptAt?: string | Date | null;
  whatsAppQrErrorMessage?: string | null;
  whatsAppQrSkipReason?: string | null;

  whatsAppQrProviderStatusName?: string | null;
  whatsAppQrProviderStatusDescription?: string | null;

  whatsAppQrCanRetry?: boolean;
  whatsAppQrWasForced?: boolean;
  whatsAppQrNeedsReview?: boolean;
}

export interface GuestParameters {
  eventId?: number;
  guestId?: number;
  guestLocalId?: number;
  categoryId?: number;
  availability_Type: string;
  giftBrought?: boolean;
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
  gift_Brought?: boolean | null;
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
