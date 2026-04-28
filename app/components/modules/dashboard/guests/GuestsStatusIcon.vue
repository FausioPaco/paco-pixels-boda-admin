<script setup lang="ts">
import {
  hasVisibleOutboundActivity,
  sortOutboundsByPriority,
} from '~/utils/whatsappUtils';

type Props = {
  guest: Guest;
};

const props = defineProps<Props>();
const { t } = useI18n();

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

const outboundTypeShortLabelMap = computed<
  Record<GuestWhatsAppOutboundType, string>
>(() => ({
  [GuestWhatsAppOutboundType.Unknown]: t('guests.wa_type_short_unknown'),
  [GuestWhatsAppOutboundType.QrCode]: t('guests.wa_type_short_qrcode'),
  [GuestWhatsAppOutboundType.Invitation]: t('guests.wa_type_short_invitation'),
  [GuestWhatsAppOutboundType.SaveTheDate]: t(
    'guests.wa_type_short_save_the_date',
  ),
  [GuestWhatsAppOutboundType.Reminder]: t('guests.wa_type_short_reminder'),
}));

const getOutboundTypeShortLabel = (type: GuestWhatsAppOutboundType) =>
  outboundTypeShortLabelMap.value[type] ?? t('guests.wa_type_short_unknown');

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
      :type-label="t('guests.wa_type_short_qrcode')"
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
          class="inline-flex items-center rounded-md border border-grey-200 bg-grey-50 px-1.5 py-0.5 text-[11px] font-medium text-grey-700"
        >
          +{{ hiddenOutboundsCount }}
        </span>
      </template>
    </BaseTooltip>

    <BaseTooltip
      v-if="showAbsent"
      :text="t('guests.status_absent')"
      placement="top"
    >
      <template #trigger>
        <IconCloseSimple
          :font-controlled="false"
          class="size-[16px] text-danger-500"
        />
      </template>
    </BaseTooltip>

    <BaseTooltip
      v-if="showPresence"
      :text="t('guests.status_presence_confirmed')"
      placement="top"
    >
      <template #trigger>
        <span
          class="inline-flex items-center rounded-md bg-primary-50 px-1.5 py-1"
        >
          <IconCheckmark
            :font-controlled="false"
            class="size-[14px] text-primary-700"
          />
        </span>
      </template>
    </BaseTooltip>

    <BaseTooltip
      v-if="showArrival"
      :text="t('guests.status_arrival_confirmed')"
      placement="top"
    >
      <template #trigger>
        <span
          class="inline-flex items-center rounded-md bg-success-50 px-1.5 py-1"
        >
          <IconDoorEnter
            :font-controlled="false"
            class="size-[14px] text-success-700"
          />
        </span>
      </template>
    </BaseTooltip>
  </div>
</template>
