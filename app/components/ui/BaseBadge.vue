<script setup lang="ts">
type BadgeStatus =
  | 'success'
  | 'primary'
  | 'warning'
  | 'error'
  | 'info'
  | 'default';

interface IBadgeProps {
  type?: BadgeStatus;
  text: string | number;
  label?: string;
  icon?: string;
  iconSize?: number;
}

withDefaults(defineProps<IBadgeProps>(), {
  type: 'success',
  label: 'Badge',
  icon: '',
  iconSize: 16,
});
</script>
<template>
  <small
    class="inline-flex max-w-fit items-center rounded px-3 py-2 text-sm font-medium"
    :class="{
      'bg-green-50 text-green-800': type === 'success',
      'bg-primary-50 text-primary-800': type === 'primary',
      'bg-warning-50 text-warning-800': type === 'warning',
      'bg-danger-50 text-danger-800': type === 'error',
      'bg-grey-50 text-grey-800': type === 'default',
    }"
    role="badge"
    :aria-label="`${label} - ${text}`"
  >
    <template v-if="icon">
      <component
        :is="`icon-${icon}`"
        :font-controlled="false"
        :width="iconSize"
        :height="iconSize"
      />
    </template>

    <span :class="icon ? 'pl-1' : ''">{{ text }}</span>
  </small>
</template>
