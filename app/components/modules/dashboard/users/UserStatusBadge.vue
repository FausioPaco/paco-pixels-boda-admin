<script setup lang="ts">
interface Props {
  isOnline?: boolean;
  lastActivityAt?: string | Date | null;
}

const props = defineProps<Props>();

const lastSeenText = computed(() => {
  if (!props.lastActivityAt) return 'Nunca online';

  const date =
    typeof props.lastActivityAt === 'string'
      ? new Date(props.lastActivityAt)
      : props.lastActivityAt;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Online agora';
  if (diffMin === 1) return 'Visto há 1 minuto';
  if (diffMin < 60) return `Visto há ${diffMin} minutos`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'Visto há 1 hora';
  if (diffHours < 24) return `Visto há ${diffHours} horas`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Visto há 1 dia';

  return `Visto há ${diffDays} dias`;
});

const label = computed(() => {
  if (props.isOnline) return 'Online';
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
