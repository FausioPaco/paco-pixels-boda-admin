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
  <div class="border-primary-100 bg-primary-50/10 w-full rounded-md border p-4">
    <div class="flex flex-wrap-reverse items-center justify-between gap-3">
      <dl class="min-w-0">
        <dt class="text-grey-300 text-sm">
          {{ title }}
        </dt>

        <dd class="text-grey-800 mt-1 text-2xl font-bold">
          {{ value }}
        </dd>
      </dl>

      <div
        v-if="icon"
        class="bg-primary-50 text-primary-800 flex h-10 w-10 items-center justify-center rounded-md"
      >
        <component
          :is="`icon-${icon}`"
          :font-controlled="false"
          class="size-6"
        />
      </div>
    </div>
  </div>
</template>
