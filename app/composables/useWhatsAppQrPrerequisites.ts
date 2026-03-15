export interface WhatsAppQrPrerequisitesResult {
  isPartner: boolean;
  canSend: boolean;
  blockingIssues: string[];
  warnings: string[];
  missingFields: {
    eventName: boolean;
    eventDate: boolean;
    location: boolean;
    eventEndTime: boolean;
  };
}

const hasText = (value?: string | null) => !!value && value.trim().length > 0;

const hasValidDate = (value?: Date | string | null) => {
  if (!value) return false;

  const parsed = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const useWhatsAppQrPrerequisites = (
  event: Ref<BodaEvent | null> | ComputedRef<BodaEvent | null>,
  clientCode: Ref<string> | ComputedRef<string> | string = 'mariee',
) => {
  const resolvedClientCode = computed(() => {
    if (typeof clientCode === 'string') return clientCode;
    return clientCode.value;
  });

  const isPartner = computed(
    () => resolvedClientCode.value?.trim().toLowerCase() === 'mariee',
  );

  const missingFields = computed(() => {
    const currentEvent = event.value;

    return {
      eventName: !hasText(currentEvent?.name),
      eventDate: !hasValidDate(currentEvent?.event_Date),
      location: !hasText(currentEvent?.location),
      eventStartTime: !hasText(currentEvent?.event_Start_Time),
      eventEndTime: !hasText(currentEvent?.event_End_Time),
    };
  });

  const blockingIssues = computed(() => {
    if (!isPartner.value) return [];

    const issues: string[] = [];

    if (missingFields.value.eventName) {
      issues.push(
        'Preencha o nome do evento antes de enviar QR Codes por WhatsApp.',
      );
    }

    if (missingFields.value.eventDate) {
      issues.push(
        'Preencha a data do evento antes de enviar QR Codes por WhatsApp.',
      );
    }

    if (missingFields.value.location) {
      issues.push(
        'Preencha a localização do evento antes de enviar QR Codes por WhatsApp.',
      );
    }
    if (missingFields.value.eventStartTime) {
      issues.push(
        'Preencha o horário de início do evento antes de enviar QR Codes por WhatsApp.',
      );
    }

    return issues;
  });

  const warnings = computed(() => {
    if (!isPartner.value) return [];

    const issues: string[] = [];

    if (missingFields.value.eventEndTime) {
      issues.push('O horário do evento ainda não está preenchido.');
    }

    return issues;
  });

  const canSend = computed(() => blockingIssues.value.length === 0);

  const prerequisites = computed<WhatsAppQrPrerequisitesResult>(() => ({
    isPartner: isPartner.value,
    canSend: canSend.value,
    blockingIssues: blockingIssues.value,
    warnings: warnings.value,
    missingFields: missingFields.value,
  }));

  return {
    isPartner,
    canSend,
    blockingIssues,
    warnings,
    missingFields,
    prerequisites,
  };
};
