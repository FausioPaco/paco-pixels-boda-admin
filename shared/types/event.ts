export interface Event {
  id: number;
  name: string;
  description: string;
  guestsCount: number;
  desksCount: number;
  messagesCount: number;
  fileCount: number;
  suppliersCount: number;
  initials: string;
  slug: string | null;
  eventTypeId: number | undefined;
  eventTypeName?: string | undefined;
  created_At: Date;
}

export interface EventType {
  id: number;
  name: string;
  slug: string;
  description?: string | undefined;
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
}
