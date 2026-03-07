<script setup lang="ts">
type Props = {
  guest: Guest;
  compact?: boolean;
  label?: string;
};

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  label: undefined,
});

const status = computed(() => props.guest.whatsAppQrStatus ?? 'not_sent');
const label = computed(
  () =>
    props.guest.whatsAppQrStatusLabel ??
    (status.value === 'sent' ? 'Enviado por WhatsApp' : 'Por enviar'),
);

const tooltipText = computed(() => {
  const parts: string[] = [label.value];

  if (props.guest.whatsAppQrSentAt && status.value === 'sent') {
    parts.push(
      `Enviado em ${useDateFormat(props.guest.whatsAppQrSentAt, 'DD/MM/YYYY HH:mm').value}`,
    );
  }

  if (props.guest.whatsAppQrLastAttemptAt && status.value !== 'sent') {
    parts.push(
      `Última tentativa: ${useDateFormat(props.guest.whatsAppQrLastAttemptAt, 'DD/MM/YYYY HH:mm').value}`,
    );
  }

  if (props.guest.whatsAppQrSkipReason) {
    parts.push(props.guest.whatsAppQrSkipReason);
  }

  if (props.guest.whatsAppQrErrorMessage) {
    parts.push(props.guest.whatsAppQrErrorMessage);
  }

  return parts.join(' • ');
});

const chipClasses = computed(() => {
  switch (status.value) {
    case 'sent':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'invalid_phone':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    case 'failed_temporary':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    case 'failed':
      return 'bg-danger-50 text-danger-700 ring-1 ring-danger-200';
    default:
      return 'bg-grey-100 text-grey-500 ring-1 ring-grey-200';
  }
});

const dotClasses = computed(() => {
  switch (status.value) {
    case 'sent':
      return 'bg-emerald-500';
    case 'pending':
      return 'bg-amber-500';
    case 'invalid_phone':
      return 'bg-slate-400';
    case 'failed_temporary':
      return 'bg-orange-500';
    case 'failed':
      return 'bg-danger-500';
    default:
      return 'bg-grey-400';
  }
});
</script>

<template>
  <BaseTooltip :text="tooltipText" placement="top">
    <template #trigger>
      <span
        class="inline-flex items-center gap-1 rounded-full font-semibold transition"
        :class="
          compact
            ? ['px-1.5 py-1 text-[10px]', chipClasses]
            : ['px-2.5 py-1.5 text-xs', chipClasses]
        "
      >
        <span class="size-1.5 rounded-full" :class="dotClasses"></span>
        <span>
          <IconWhatsapp
            :font-controlled="false"
            class="size-[14px]"
            :class="{
              'text-emerald-500': status === 'sent',
              'text-amber-500': status === 'pending',
              'text-slate-400': status === 'invalid_phone',
              'text-orange-500': status === 'failed_temporary',
              'text-danger-500': status === 'failed',
            }"
        /></span>
        <span
          v-if="label"
          :class="{
            'text-emerald-500': status === 'sent',
            'text-amber-500': status === 'pending',
            'text-slate-400': status === 'invalid_phone',
            'text-orange-500': status === 'failed_temporary',
            'text-danger-500': status === 'failed',
          }"
        >
          {{ label }}
        </span>
      </span>
    </template>
  </BaseTooltip>
</template>
