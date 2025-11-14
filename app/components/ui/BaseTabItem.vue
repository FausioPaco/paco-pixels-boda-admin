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
    :class="isActive ? 'border-b-primary-700 border-b-2' : null"
    role="presentation"
  >
    <button
      :id="id"
      class="outline-primary-700 mb-2 flex w-full cursor-pointer items-center justify-center gap-x-3 bg-transparent text-lg"
      :class="
        isActive ? 'text-primary-700 font-bold' : 'text-grey-400 font-medium'
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
