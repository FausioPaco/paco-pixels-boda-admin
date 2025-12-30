export interface BodaEvent {
  id: number;
  name: string;
  description: string;
  guestsCount: number;
  desksCount: number;
  messagesCount: number;
  fileCount: number;
  suppliersCount: number;
  budgetTotal: number;
  budgetCurrency: string;
  initials: string;
  slug: string | undefined;
  eventTypeId: number | undefined;
  eventTypeName?: string | undefined;
  eventTypeIcon?: string | undefined;
  eventTypeSlug?: string | undefined;
  event_Date?: Date | undefined;
  has_QRCode_Image?: boolean;
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
  description?: string | null | undefined;
  initials: string;
  eventTypeId?: number | undefined;
  slug?: string | undefined;
  event_Date?: Date | undefined;
  autoCreateChecklist: boolean;
}

export interface QRCodeFileUploadResult {
  url: string;
  message: string;
}
