export interface FileItem {
  id: number;
  name: string;
  content_Type: string;
  url: string;
  eventId?: number;
  created_At: string;
}

export interface FileInput {
  file: File;
  eventId: number;
}

export interface FileParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}
