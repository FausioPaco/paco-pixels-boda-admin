<script setup lang="ts">
type Props = {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidthClass?: string; // ex: 'max-w-[220px]'
};

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  maxWidthClass: 'max-w-[240px]',
});

const placementClass = computed(() => {
  switch (props.placement) {
    case 'bottom':
      return 'left-1/2 top-full mt-2 -translate-x-1/2';
    case 'left':
      return 'right-full top-1/2 mr-2 -translate-y-1/2';
    case 'right':
      return 'left-full top-1/2 ml-2 -translate-y-1/2';
    default:
      return 'left-1/2 bottom-full mb-2 -translate-x-1/2';
  }
});
</script>

<template>
  <span class="relative inline-flex">
    <span class="inline-flex">
      <slot></slot>
    </span>

    <span
      class="pointer-events-none absolute z-50 hidden group-hover:block"
    ></span>

    <span class="group relative inline-flex animate-fadeIn">
      <slot name="trigger"></slot>

      <span
        class="bg-grey-900 pointer-events-none absolute z-50 hidden select-none rounded-lg px-2 py-1 text-xs text-white shadow-lg group-hover:block"
        :class="[placementClass, maxWidthClass]"
        role="tooltip"
      >
        {{ text }}
      </span>
    </span>
  </span>
</template>
