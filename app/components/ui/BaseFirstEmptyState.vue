<script setup lang="ts">
defineOptions({ name: 'BaseEmptyState' });

defineProps<{
  icon: string;
  title: string;
  description: string;
  showButton?: boolean;
  buttonLabel?: string;
  buttonIcon?: string;
}>();

defineEmits<{
  (e: 'action'): void;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center py-10 text-center"
    role="region"
    :aria-label="title"
  >
    <component
      :is="icon"
      :font-controlled="false"
      class="text-grey-400 mb-4 h-16 w-16"
      aria-hidden="true"
    />

    <h4 class="text-grey-400 mb-2 text-2xl font-semibold">
      {{ title }}
    </h4>

    <p class="text-grey-400 mb-4 max-w-md">
      {{ description }}
    </p>

    <!-- Slot para custom content -->
    <slot>
      <BaseButton
        v-if="showButton"
        :icon="buttonIcon"
        :aria-label="buttonLabel"
        btn-type="primary"
        size="md"
        @click="$emit('action')"
      >
        {{ buttonLabel }}
      </BaseButton>
    </slot>
  </div>
</template>
