<script setup lang="ts">
import type { GuestWhatsAppQrStatus } from '~~/shared/types/guest';

defineOptions({
  name: 'GuestsWhatsAppStatusChip',
});

interface Props {
  status?: GuestWhatsAppQrStatus | null;
  label?: string | null;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'not_sent',
  label: null,
  compact: false,
});

const fallbackLabelMap: Record<GuestWhatsAppQrStatus, string> = {
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

const normalizedStatus = computed<GuestWhatsAppQrStatus>(() => {
  return props.status ?? 'not_sent';
});

const chipLabel = computed(() => {
  return props.label?.trim() || fallbackLabelMap[normalizedStatus.value];
});

const chipClasses = computed(() => {
  const base =
    'inline-flex items-center rounded-full border font-medium whitespace-nowrap';

  const size = props.compact
    ? 'px-2 py-0.5 text-[11px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  const paletteMap: Record<GuestWhatsAppQrStatus, string> = {
    not_sent: 'border-grey-200 bg-grey-50 text-grey-700',
    pending: 'border-warning-200 bg-warning-50 text-warning-700',
    accepted: 'border-primary-200 bg-primary-50 text-primary-700',
    delivered: 'border-info-200 bg-info-50 text-info-700',
    seen: 'border-success-200 bg-success-50 text-success-700',
    invalid_phone: 'border-grey-300 bg-grey-100 text-grey-700',
    failed_temporary: 'border-warning-200 bg-warning-50 text-warning-800',
    failed: 'border-danger-200 bg-danger-50 text-danger-700',
    delivery_unknown: 'border-secondary-200 bg-secondary-50 text-secondary-700',
    needs_review: 'border-danger-200 bg-danger-50 text-danger-800',
  };

  return [base, size, paletteMap[normalizedStatus.value]].join(' ');
});

const dotClasses = computed(() => {
  const base = 'inline-block rounded-full shrink-0';
  const size = props.compact ? 'h-1.5 w-1.5' : 'h-2 w-2';

  const colorMap: Record<GuestWhatsAppQrStatus, string> = {
    not_sent: 'bg-grey-400',
    pending: 'bg-warning-500',
    accepted: 'bg-primary-500',
    delivered: 'bg-info-500',
    seen: 'bg-success-500',
    invalid_phone: 'bg-grey-500',
    failed_temporary: 'bg-warning-600',
    failed: 'bg-danger-500',
    delivery_unknown: 'bg-warning-500',
    needs_review: 'bg-danger-600',
  };

  return [base, size, colorMap[normalizedStatus.value]].join(' ');
});

const titleText = computed(() => {
  return chipLabel.value;
});
</script>

<template>
  <span :class="chipClasses" :title="titleText" :aria-label="titleText">
    <span :class="dotClasses"></span>
    <span>{{ chipLabel }}</span>
  </span>
</template>
