<script setup lang="ts">
import {
  getOutboundTypeShortLabel,
  hasVisibleOutboundActivity,
  sortOutboundsByPriority,
} from '~/utils/whatsappUtils';

type Props = {
  guest: Guest;
};

const props = defineProps<Props>();

const showAbsent = computed(() => !!props.guest.absence_Declared);

const showPresence = computed(
  () => !showAbsent.value && !!props.guest.presence_Confirmed,
);

const showArrival = computed(() => !showAbsent.value && !!props.guest.arrived);

const showQr = computed(
  () =>
    !!props.guest.whatsAppQrStatus &&
    props.guest.whatsAppQrStatus !== 'not_sent',
);

const visibleOutbounds = computed(() => {
  return sortOutboundsByPriority(props.guest.whatsAppOutbounds).filter(
    (item) =>
      item.type !== GuestWhatsAppOutboundType.QrCode &&
      hasVisibleOutboundActivity(item),
  );
});

const inlineOutbounds = computed(() => visibleOutbounds.value.slice(0, 2));

const hiddenOutboundsCount = computed(() =>
  Math.max(visibleOutbounds.value.length - inlineOutbounds.value.length, 0),
);

const hiddenOutboundsTooltip = computed(() => {
  return visibleOutbounds.value
    .slice(2)
    .map(
      (item) => `${getOutboundTypeShortLabel(item.type)}: ${item.statusLabel}`,
    )
    .join(' • ');
});
</script>

<template>
  <div class="flex items-center gap-2">
    <GuestsWhatsAppStatusChip
      v-if="showQr"
      :status="guest.whatsAppQrStatus"
      type-label="QR"
      compact
    />

    <GuestsWhatsAppStatusChip
      v-for="item in inlineOutbounds"
      :key="item.type"
      :status="item.status"
      :type-label="getOutboundTypeShortLabel(item.type)"
      compact
    />

    <BaseTooltip
      v-if="hiddenOutboundsCount > 0"
      :text="hiddenOutboundsTooltip"
      placement="top"
    >
      <template #trigger>
        <span
          class="border-grey-200 bg-grey-50 text-grey-700 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium"
        >
          +{{ hiddenOutboundsCount }}
        </span>
      </template>
    </BaseTooltip>

    <BaseTooltip v-if="showAbsent" text="Ausente" placement="top">
      <template #trigger>
        <IconCloseSimple
          :font-controlled="false"
          class="text-danger-500 size-[16px]"
        />
      </template>
    </BaseTooltip>

    <BaseTooltip v-if="showPresence" text="Presença confirmada" placement="top">
      <template #trigger>
        <span
          class="bg-primary-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconCheckmark
            :font-controlled="false"
            class="text-primary-700 size-[14px]"
          />
        </span>
      </template>
    </BaseTooltip>

    <BaseTooltip v-if="showArrival" text="Chegada confirmada" placement="top">
      <template #trigger>
        <span
          class="bg-success-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconDoorEnter
            :font-controlled="false"
            class="text-success-700 size-[14px]"
          />
        </span>
      </template>
    </BaseTooltip>
  </div>
</template>
