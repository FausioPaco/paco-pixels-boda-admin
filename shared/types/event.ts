export interface Event {
  id: number;
  name: string;
  description: string;
  guestsCount: number;
  desksCount: number;
  messagesCount: number;
  fileCount: number;
  suppliersCount: number;
  created_At: Date;
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
}
