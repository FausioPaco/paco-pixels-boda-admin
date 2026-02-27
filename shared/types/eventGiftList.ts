export type EventGiftListMode = 'manual' | 'upload';
export type EventGiftListFileType = 'pdf' | 'image';

export type EventGiftListFile = {
  id: number;
  giftListId: number;
  fileUrl?: string;
  fileType?: EventGiftListFileType;
  originalFileName?: string | null;
  mimeType?: string | null;
  sizeInBytes?: number | null;
};

export type EventGiftList = {
  id: number;
  eventId?: number;
  mode: EventGiftListMode;
  visible: boolean;

  // Conteúdo sanitizado (modo manual)
  htmlContent?: string;
  file?: EventGiftListFile | null;
};

export type EventGiftListUpdateMode = {
  mode: EventGiftListMode;
};

export type EventGiftListEditorUpdate = {
  htmlContent: string;
};
