import type { GuestWhatsAppOutboundType } from './guest';

export type WhatsAppQrSendStatus =
  | 'Pending'
  | 'Accepted'
  | 'Delivered'
  | 'Seen'
  | 'SkippedInvalidPhone'
  | 'SkippedAlreadyDelivered'
  | 'FailedTemporary'
  | 'FailedPermanent'
  | 'DeliveryUnknown'
  | 'NeedsReview';

export type WhatsAppQrLogsSummary = {
  eventId: number;
  total: number;

  pending: number;
  accepted: number;
  delivered: number;
  seen: number;

  skippedInvalidPhone: number;
  skippedAlreadyDelivered: number;

  failedTemporary: number;
  failedPermanent: number;

  deliveryUnknown: number;
  needsReview: number;

  uiNote?: string;
};

export type SendQrToGuestResponse = {
  status: 'accepted' | 'failed' | 'skipped' | 'skipped_already_delivered';

  reason?: string | null;

  providerMessageId?: string | null;
  providerStatus?: string | null;
  providerStatusDescription?: string | null;

  acceptedAt?: string | Date | null;
  providerAcceptedAt?: string | Date | null;

  note?: string | null;
  error?: string | null;
};

export type WhatsAppDeliverySummary = {
  eventId: number;
  total: number;

  pending: number;
  accepted: number;
  delivered: number;
  seen: number;

  skippedInvalidPhone: number;
  skippedAlreadyDelivered: number;

  failedTemporary: number;
  failedPermanent: number;

  deliveryUnknown: number;
  needsReview: number;

  uiNote?: string | null;
};

export type SendWhatsAppOutboundToGuestResponse = {
  status: string;
  reason?: string | null;

  providerMessageId?: string | null;
  providerStatus?: string | null;
  providerStatusDescription?: string | null;
  providerAcceptedAt?: string | Date | null;

  note?: string | null;
};

export type StartWhatsAppOutboundJobResponse = {
  jobId: string;
  total: number;
  messageType: GuestWhatsAppOutboundType;
  uiNote?: string | null;
};

export type WhatsAppOutboundJobStatus = {
  jobId: string;
  type: string;
  status: string;
  messageType: GuestWhatsAppOutboundType;
  total: number;
  processed: number;
  percent: number;
  error?: string | null;
};
