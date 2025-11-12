export type MessageType = 'normal' | 'whatsapp';

export interface Message {
  id: number | string;
  name: string;
  description: string;
  eventId?: number;
  eventName: string;
  created_At: string;
}

export interface MessageInput {
  name: string;
  description: string;
  eventId?: number;
}

export interface MessageParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}
