export type EventProgramMode = 'manual' | 'upload';
export type EventProgramFileType = 'pdf' | 'image';

export type EventProgramFile = {
  id: number;
  programId: number;
  isInternal: boolean;
  fileUrl?: string;
  format?: EventProgramFileType;
  originalFileName?: string | null;
  mimeType?: string | null;
  sizeInBytes?: number | null;
};

export type EventProgramItem = {
  id: number;
  programId?: number;
  time: string;
  title: string;
  description?: string | null;
  iconKey: string;
  sortOrder: number;
};

export type EventProgram = {
  id: number;
  eventId?: number;
  mode: EventProgramMode;
  visible: boolean;
  file?: EventProgramFile | null;
  items: EventProgramItem[];
};

export type EventProgramUpdateMode = {
  mode: EventProgramMode;
};

export type EventProgramItemForCreation = {
  time: string;
  title: string;
  description?: string | null;
};

export type EventProgramItemForUpdate = {
  time: string;
  title: string;
  description?: string | null;
};

export type EventProgramItemsReorder = {
  orderedItemIds: number[];
};
