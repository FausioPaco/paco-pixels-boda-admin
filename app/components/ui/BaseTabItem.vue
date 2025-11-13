<script setup lang="ts">
interface ITabsProps {
  id: string;
  icon: string;
  tabPosition: number;
  totalTabs: number;
  isActive: boolean;
}

defineProps<ITabsProps>();
defineEmits(['click']);
</script>

<template>
  <li
    :class="isActive ? 'border-b-2 border-b-primary-600' : null"
    role="presentation"
  >
    <button
      :id="id"
      class="mb-2 flex w-full cursor-pointer items-center justify-center gap-x-3 bg-transparent text-lg outline-primary-600"
      :class="
        isActive ? 'font-bold text-primary-600' : 'font-medium text-grey-700'
      "
      role="tab"
      :aria-setsize="totalTabs"
      :aria-posinset="tabPosition"
      tabindex="0"
      :aria-controls="id"
      :aria-selected="isActive"
      @click="$emit('click')"
    >
      <component
        :is="`icon-${icon}`"
        :font-controlled="false"
        width="24"
        height="24"
      />
      <slot></slot>
    </button>
  </li>
</template>
