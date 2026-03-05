export type WhatsAppQrSendStatus =
  | 'Pending'
  | 'Sent'
  | 'SkippedInvalidPhone'
  | 'SkippedAlreadySent'
  | 'FailedTemporary'
  | 'FailedPermanent';

export type WhatsAppQrLogsSummary = {
  eventId: number;
  total: number;

  pending: number;
  sent: number;
  skippedInvalidPhone: number;
  skippedAlreadySent: number;
  failedTemporary: number;
  failedPermanent: number;

  uiNote?: string;
};

export type SendQrToGuestResponse = {
  status: string; // ex: "Sent" | "skipped" | "FailedPermanent"
  reason?: string | null;
  messageId?: string | null;
  error?: string | null;
};