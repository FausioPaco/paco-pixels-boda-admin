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
    'inline-flex items-center rounded-md border font-medium whitespace-nowrap';

  const size = 'text-xs px-1.5 py-0.5';

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

const iconClasses = computed(() => {
  const colorMap: Record<GuestWhatsAppQrStatus, string> = {
    not_sent: 'text-grey-400',
    pending: 'text-warning-500',
    accepted: 'text-primary-500',
    delivered: 'text-info-500',
    seen: 'text-success-500',
    invalid_phone: 'text-grey-500',
    failed_temporary: 'text-warning-600',
    failed: 'text-danger-500',
    delivery_unknown: 'text-warning-500',
    needs_review: 'text-danger-600',
  };

  return [colorMap[normalizedStatus.value]].join(' ');
});
</script>

<template>
  <BaseTooltip :text="chipLabel" placement="top">
    <template #trigger>
      <div :class="chipClasses">
        <IconWhatsapp
          :font-controlled="false"
          class="size-[16px]"
          :class="iconClasses"
        />
        <span v-if="label" class="ml-1">{{ label }}</span>
      </div>
    </template>
  </BaseTooltip>
</template>
