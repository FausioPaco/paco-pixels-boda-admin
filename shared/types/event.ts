export interface BodaEvent {
  id: number;
  name: string;
  description: string;
  guestsCount: number;
  desksCount: number;
  messagesCount: number;
  fileCount: number;
  suppliersCount: number;
  initials: string;
  slug: string | undefined;
  eventTypeId: number | undefined;
  eventTypeName?: string | undefined;
  eventTypeIcon?: string | undefined;
  event_Date?: Date | undefined;
  hasQRCodeImage?: boolean;
  qrCodeImage_Url?: string;
  created_At: Date;
}

export interface EventType {
  id: number;
  name: string;
  slug: string;
  description?: string | undefined;
  icon: string;
  active: boolean;
}

export interface EventParameters {
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}

export interface EventInput {
  name: string;
  description: string;
  initials: string;
  eventTypeId?: number | undefined;
  slug?: string | undefined;
  event_Date?: Date | undefined;
}

export interface QRCodeFileUploadResult {
  url: string;
  message: string;
}
