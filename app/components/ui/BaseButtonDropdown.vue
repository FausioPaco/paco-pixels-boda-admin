<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';

defineOptions({
  name: 'BaseButtonDropdown',
});

interface Props {
  label: string;
  options: ButtonDropdownOption[];
  btnType?: 'primary' | 'outline-primary' | 'white';
  btnSize?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  iconSize?: number;
  disabled?: boolean;
  menuWidthClass?: string;
  align?: 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  btnType: 'outline-primary',
  btnSize: 'sm',
  icon: '',
  iconSize: 20,
  disabled: false,
  menuWidthClass: 'min-w-[240px]',
  align: 'left',
});

const emit = defineEmits<{
  (e: 'select', option: ButtonDropdownOption): void;
}>();

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuId = useId();

const enabledOptions = computed(() =>
  props.options.filter((option) => !option.disabled),
);

const focusedIndex = ref(-1);

const dropdownPositionClass = computed(() =>
  props.align === 'right' ? 'right-0' : 'left-0',
);

const optionRefs = ref<(HTMLButtonElement | null)[]>([]);

const setOptionRef = (el: HTMLButtonElement | null, index: number) => {
  optionRefs.value[index] = el;
};

const focusOption = async (index: number) => {
  if (index < 0 || index >= props.options.length) return;
  if (props.options[index]?.disabled) return;

  focusedIndex.value = index;
  await nextTick();
  optionRefs.value[index]?.focus();
};

const getFirstEnabledIndex = () =>
  props.options.findIndex((option) => !option.disabled);

const getLastEnabledIndex = () => {
  for (let i = props.options.length - 1; i >= 0; i -= 1) {
    if (!props.options[i]?.disabled) return i;
  }
  return -1;
};

const getNextEnabledIndex = (startIndex: number) => {
  for (let i = startIndex + 1; i < props.options.length; i += 1) {
    if (!props.options[i]?.disabled) return i;
  }
  return getFirstEnabledIndex();
};

const getPreviousEnabledIndex = (startIndex: number) => {
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    if (!props.options[i]?.disabled) return i;
  }
  return getLastEnabledIndex();
};

const openMenu = async () => {
  if (props.disabled || !enabledOptions.value.length) return;

  isOpen.value = true;

  const firstIndex = getFirstEnabledIndex();
  if (firstIndex >= 0) {
    await focusOption(firstIndex);
  }
};

const closeMenu = () => {
  isOpen.value = false;
  focusedIndex.value = -1;
  nextTick(() => {
    triggerRef.value?.focus();
  });
};

const toggleMenu = async () => {
  if (isOpen.value) {
    closeMenu();
    return;
  }

  await openMenu();
};

const handleSelect = (option: ButtonDropdownOption) => {
  if (option.disabled) return;
  emit('select', option);
  closeMenu();
};

const onTriggerKeydown = async (event: KeyboardEvent) => {
  if (props.disabled) return;

  switch (event.key) {
    case 'Enter':
    case ' ':
    case 'ArrowDown':
      event.preventDefault();
      await openMenu();
      break;
    case 'ArrowUp':
      event.preventDefault();
      isOpen.value = true;
      await nextTick();
      {
        const lastIndex = getLastEnabledIndex();
        if (lastIndex >= 0) {
          await focusOption(lastIndex);
        }
      }
      break;
  }
};

const onMenuKeydown = async (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      closeMenu();
      break;
    case 'ArrowDown':
      event.preventDefault();
      await focusOption(getNextEnabledIndex(focusedIndex.value));
      break;
    case 'ArrowUp':
      event.preventDefault();
      await focusOption(getPreviousEnabledIndex(focusedIndex.value));
      break;
    case 'Home':
      event.preventDefault();
      await focusOption(getFirstEnabledIndex());
      break;
    case 'End':
      event.preventDefault();
      await focusOption(getLastEnabledIndex());
      break;
    case 'Tab':
      closeMenu();
      break;
  }
};

onClickOutside(rootRef, () => {
  if (isOpen.value) {
    isOpen.value = false;
    focusedIndex.value = -1;
  }
});
</script>

<template>
  <div ref="rootRef" class="relative inline-flex">
    <BaseButton
      ref="triggerRef"
      :btn-type="btnType"
      :btn-size="btnSize"
      :icon="icon"
      :icon-size="iconSize"
      :disabled="disabled || !options.length"
      class="animate-fadeIn"
      aria-haspopup="menu"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="menuId"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <span class="flex items-center gap-2">
        <span>{{ label }}</span>

        <svg
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
    </BaseButton>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-if="isOpen"
        :id="menuId"
        ref="menuRef"
        role="menu"
        :class="[
          'border-grey-100 absolute top-full z-40 mt-2 rounded-xl border bg-white p-1 shadow-xl',
          menuWidthClass,
          dropdownPositionClass,
        ]"
        @keydown="onMenuKeydown"
      >
        <button
          v-for="(option, index) in options"
          :key="option.id"
          :ref="(el) => setOptionRef(el as HTMLButtonElement | null, index)"
          type="button"
          role="menuitem"
          :tabindex="focusedIndex === index ? 0 : -1"
          class="focus-visible:ring-primary-300 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2"
          :class="
            option.disabled
              ? 'text-grey-400 cursor-not-allowed'
              : option.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-grey-700 hover:bg-primary-50 hover:text-primary-600'
          "
          :disabled="option.disabled"
          :aria-disabled="option.disabled ? 'true' : 'false'"
          @click="handleSelect(option)"
          @mouseenter="!option.disabled ? (focusedIndex = index) : null"
        >
          {{ option.label }}
        </button>
      </div>
    </transition>
  </div>
</template>
