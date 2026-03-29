<script setup lang="ts">
defineOptions({
  name: 'GuestsWhatsAppStatusChip',
});

interface Props {
  status?: GuestWhatsAppDeliveryStatus | null;
  label?: string | null;
  compact?: boolean;
  typeLabel?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'not_sent',
  label: null,
  compact: false,
  typeLabel: null,
});

const fallbackLabelMap: Record<GuestWhatsAppDeliveryStatus, string> = {
  not_sent: 'Por enviar',
  pending: 'Em processamento',
  accepted: 'Aceite pela plataforma',
  delivered: 'Entregue',
  seen: 'Visualizado',
  invalid_phone: 'Número inválido',
  failed_temporary: 'Falha temporária',
  failed: 'Falha no envio',
  delivery_unknown: 'Entrega por confirmar',
  needs_review: 'Precisa de verificação',
};

const normalizedStatus = computed<GuestWhatsAppDeliveryStatus>(() => {
  return props.status ?? 'not_sent';
});

const chipLabel = computed(() => {
  return props.label?.trim() || fallbackLabelMap[normalizedStatus.value];
});

const tooltipText = computed(() => {
  if (props.typeLabel) {
    return `${props.typeLabel}: ${chipLabel.value}`;
  }

  return chipLabel.value;
});

const chipClasses = computed(() => {
  const base =
    'inline-flex items-center rounded-md border font-medium whitespace-nowrap';

  const size = props.compact
    ? 'text-[11px] px-1.5 py-0.5'
    : 'text-xs px-2 py-1';

  const paletteMap: Record<GuestWhatsAppDeliveryStatus, string> = {
    not_sent: 'border-grey-200 bg-grey-50 text-grey-700',
    pending: 'border-warning-200 bg-warning-50 text-warning-700',
    accepted: 'border-primary-200 bg-primary-50 text-primary-700',
    delivered: 'border-success-200 bg-success-50 text-success-700',
    seen: 'border-success-200 bg-success-50 text-success-700',
    invalid_phone: 'border-grey-300 bg-grey-100 text-grey-700',
    failed_temporary: 'border-warning-200 bg-warning-50 text-warning-800',
    failed: 'border-danger-200 bg-danger-50 text-danger-700',
    delivery_unknown: 'border-secondary-200 bg-secondary-50 text-secondary-700',
    needs_review: 'border-danger-200 bg-danger-50 text-danger-800',
  };

  return [base, size, paletteMap[normalizedStatus.value]].join(' ');
});

const iconClasses = computed(() => {
  const colorMap: Record<GuestWhatsAppDeliveryStatus, string> = {
    not_sent: 'text-grey-400',
    pending: 'text-warning-500',
    accepted: 'text-primary-500',
    delivered: 'text-success-500',
    seen: 'text-success-500',
    invalid_phone: 'text-grey-500',
    failed_temporary: 'text-warning-600',
    failed: 'text-danger-500',
    delivery_unknown: 'text-warning-500',
    needs_review: 'text-danger-600',
  };

  return colorMap[normalizedStatus.value];
});
</script>

<template>
  <BaseTooltip :text="tooltipText" placement="top">
    <template #trigger>
      <div :class="chipClasses">
        <IconWhatsapp
          :font-controlled="false"
          class="size-[16px]"
          :class="iconClasses"
        />

        <span v-if="typeLabel" class="ml-1">
          {{ typeLabel }}
        </span>

        <span v-else-if="label" class="ml-1">
          {{ label }}
        </span>
      </div>
    </template>
  </BaseTooltip>
</template>
