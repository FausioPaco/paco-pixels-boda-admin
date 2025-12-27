<!-- components/ui/BaseMiniStatCard.vue -->
<script setup lang="ts">
interface IProps {
  title: string;
  value: string | number;
  icon?: string;
}

withDefaults(defineProps<IProps>(), {
  icon: '',
});
</script>

<template>
  <div class="border-grey-200 bg-grey-50 w-full rounded-md border p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-grey-500 text-sm font-medium">
          {{ title }}
        </p>

        <p class="text-grey-800 mt-1 text-2xl font-bold">
          {{ value }}
        </p>
      </div>

      <div
        v-if="icon"
        class="bg-primary-100 text-primary-700 flex h-10 w-10 items-center justify-center rounded-md"
      >
        <BaseIcon :name="icon" class="h-5 w-5" />
      </div>
    </div>
  </div>
</template>
