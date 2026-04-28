<script setup lang="ts">
interface Props {
  isOnline?: boolean;
  lastActivityAt?: string | Date | null;
}

const props = defineProps<Props>();
const { t } = useI18n();

const lastSeenText = computed(() => {
  if (!props.lastActivityAt) return t('users.status_never_online');

  const date =
    typeof props.lastActivityAt === 'string'
      ? new Date(props.lastActivityAt)
      : props.lastActivityAt;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return t('users.status_online_now');
  if (diffMin === 1) return t('users.status_seen_1_minute');
  if (diffMin < 60) return t('users.status_seen_n_minutes', { n: diffMin });

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return t('users.status_seen_1_hour');
  if (diffHours < 24) return t('users.status_seen_n_hours', { n: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return t('users.status_seen_1_day');

  return t('users.status_seen_n_days', { n: diffDays });
});

const label = computed(() => {
  if (props.isOnline) return t('users.status_online');
  return lastSeenText.value;
});

const dotClass = computed(() => {
  if (props.isOnline) return 'bg-success-500';
  return 'bg-grey-300';
});
</script>

<template>
  <div class="text-grey-300 inline-flex items-center gap-1 text-xs">
    <span
      class="inline-block h-2 w-2 rounded-full"
      :class="dotClass"
      aria-hidden="true"
    ></span>
    <span>{{ label }}</span>
  </div>
</template>
