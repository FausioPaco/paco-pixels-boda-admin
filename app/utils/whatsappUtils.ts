export const outboundTypeLabelMap: Record<GuestWhatsAppOutboundType, string> = {
  [GuestWhatsAppOutboundType.Unknown]: 'Desconhecido',
  [GuestWhatsAppOutboundType.QrCode]: 'QR Code',
  [GuestWhatsAppOutboundType.Invitation]: 'Convite',
  [GuestWhatsAppOutboundType.SaveTheDate]: 'Save the date',
  [GuestWhatsAppOutboundType.Reminder]: 'Lembrete',
};

export const outboundTypeShortLabelMap: Record<
  GuestWhatsAppOutboundType,
  string
> = {
  [GuestWhatsAppOutboundType.Unknown]: '?',
  [GuestWhatsAppOutboundType.QrCode]: 'QR',
  [GuestWhatsAppOutboundType.Invitation]: 'Conv.',
  [GuestWhatsAppOutboundType.SaveTheDate]: 'STD',
  [GuestWhatsAppOutboundType.Reminder]: 'Lemb.',
};

export const getOutboundTypeLabel = (type: GuestWhatsAppOutboundType) =>
  outboundTypeLabelMap[type] ?? 'Desconhecido';

export const getOutboundTypeShortLabel = (type: GuestWhatsAppOutboundType) =>
  outboundTypeShortLabelMap[type] ?? '?';

export const sortOutboundsByPriority = (
  outbounds?: GuestWhatsAppOutbound[],
): GuestWhatsAppOutbound[] => {
  if (!outbounds?.length) return [];

  const statusWeight: Record<GuestWhatsAppDeliveryStatus, number> = {
    needs_review: 1,
    failed: 2,
    failed_temporary: 3,
    invalid_phone: 4,
    delivery_unknown: 5,
    pending: 6,
    accepted: 7,
    delivered: 8,
    seen: 9,
    not_sent: 10,
  };

  const typeWeight: Record<GuestWhatsAppOutboundType, number> = {
    [GuestWhatsAppOutboundType.Unknown]: 99,
    [GuestWhatsAppOutboundType.QrCode]: 0,
    [GuestWhatsAppOutboundType.Invitation]: 1,
    [GuestWhatsAppOutboundType.SaveTheDate]: 2,
    [GuestWhatsAppOutboundType.Reminder]: 3,
  };

  return [...outbounds].sort((a, b) => {
    const byStatus = statusWeight[a.status] - statusWeight[b.status];
    if (byStatus !== 0) return byStatus;

    return typeWeight[a.type] - typeWeight[b.type];
  });
};

export const hasVisibleOutboundActivity = (
  outbound?: GuestWhatsAppOutbound | null,
) => {
  if (!outbound) return false;
  return outbound.status !== 'not_sent';
};
