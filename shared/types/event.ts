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

  location?: string | undefined;
  godparentsCount?: number | undefined;
  decorationType?: string | undefined;
  dietaryRestrictions?: string | undefined;
  guestProfile?: string | undefined;
  colorPalette?: string | undefined;
  event_Start_Time?: string | undefined;
  event_End_Time?: string | undefined;

  brideNationality?: string | undefined;
  groomNationality?: string | undefined;
  brideBirthDate?: Date | undefined;
  groomBirthDate?: Date | undefined;
  brideProfession?: string | undefined;
  groomProfession?: string | undefined;
  brideDocument?: string | undefined;
  groomDocument?: string | undefined;

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

export interface EventDetailsInput {
  location?: string | null | undefined;
  godparentsCount?: number | null | undefined;
  decorationType?: string | null | undefined;
  dietaryRestrictions?: string | null | undefined;
  guestProfile?: string | null | undefined;
  colorPalette?: string | null | undefined;
  event_Start_Time?: string | null | undefined;
  event_End_Time?: string | null | undefined;

  brideNationality?: string | null | undefined;
  groomNationality?: string | null | undefined;
  brideBirthDate?: Date | null | undefined;
  groomBirthDate?: Date | null | undefined;
  brideProfession?: string | null | undefined;
  groomProfession?: string | null | undefined;
  brideDocument?: string | null | undefined;
  groomDocument?: string | null | undefined;
}

export interface TimePickerValue {
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export interface EventDetailsFormValues {
  location?: string | null | undefined;
  godparentsCount?: number | null | undefined;
  decorationType?: string | null | undefined;
  dietaryRestrictions?: string | null | undefined;
  guestProfile?: string | null | undefined;
  colorPalette?: string | null | undefined;
  event_Start_Time?: string | null | undefined;
  event_End_Time?: string | null | undefined;
  brideNationality?: string | null | undefined;
  groomNationality?: string | null | undefined;
  brideBirthDate?: Date | null | undefined;
  groomBirthDate?: Date | null | undefined;
  brideProfession?: string | null | undefined;
  groomProfession?: string | null | undefined;
  brideDocument?: string | null | undefined;
  groomDocument?: string | null | undefined;
}
