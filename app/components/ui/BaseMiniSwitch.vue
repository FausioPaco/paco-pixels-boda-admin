<script setup lang="ts">
type MiniSwitchItem = {
  value: string;
  label: string;
  icon?: string; // opcional (se tiveres icons como no BaseTabItem)
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    items: MiniSwitchItem[];
    disabled?: boolean;
    size?: 'sm' | 'md';
  }>(),
  {
    disabled: false,
    size: 'md',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', v: string): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const itemRefs = ref<Array<HTMLButtonElement | null>>([]);

function setItemRef(el: HTMLButtonElement | null, idx: number) {
  itemRefs.value[idx] = el;
}

const activeIndex = computed(() => {
  const idx = props.items.findIndex((i) => i.value === props.modelValue);
  return idx >= 0 ? idx : 0;
});

const indicatorStyle = ref<Record<string, string>>({
  transform: 'translateX(0px)',
  width: '0px',
});

function updateIndicator() {
  const root = rootRef.value;
  const btn = itemRefs.value[activeIndex.value];
  if (!root || !btn) return;

  const rootRect = root.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();

  const left = btnRect.left - rootRect.left;
  const width = btnRect.width;

  indicatorStyle.value = {
    transform: `translateX(${left}px)`,
    width: `${width}px`,
  };
}

function select(value: string) {
  if (props.disabled) return;
  if (value === props.modelValue) return;

  emit('update:modelValue', value);
  emit('change', value);
}

function focusTab(index: number) {
  const btn = itemRefs.value[index];
  btn?.focus();
}

function onKeydown(e: KeyboardEvent) {
  const total = props.items.length;
  if (total <= 1) return;

  const current = activeIndex.value;

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    const next = (current + 1) % total;
    select(props.items[next]!.value);
    nextTick(() => focusTab(next));
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const prev = (current - 1 + total) % total;
    select(props.items[prev]!.value);
    nextTick(() => focusTab(prev));
    return;
  }

  if (e.key === 'Home') {
    e.preventDefault();
    select(props.items[0]!.value);
    nextTick(() => focusTab(0));
    return;
  }

  if (e.key === 'End') {
    e.preventDefault();
    const last = total - 1;
    select(props.items[last]!.value);
    nextTick(() => focusTab(last));
  }
}

let ro: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  updateIndicator();

  if (rootRef.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => updateIndicator());
    ro.observe(rootRef.value);
  }

  window.addEventListener('resize', updateIndicator, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator);
  ro?.disconnect();
  ro = null;
});

watch(
  () => props.modelValue,
  async () => {
    await nextTick();
    updateIndicator();
  },
);

const sizeClasses = computed(() => {
  if (props.size === 'sm') {
    return {
      root: 'h-10',
      btn: 'text-sm px-2',
      icon: 'w-4 h-4',
    };
  }

  return {
    root: 'h-12 p-1.5',
    btn: 'text-sm md:text-base px-4',
    icon: 'w-5 h-5',
  };
});
</script>

<template>
  <div
    ref="rootRef"
    class="border-grey-100 bg-grey-50 relative inline-flex w-full select-none items-center justify-between rounded-2xl border shadow-sm"
    :class="[sizeClasses.root, disabled ? 'opacity-70' : '']"
    role="tablist"
    aria-orientation="horizontal"
    @keydown="onKeydown"
  >
    <!-- indicador animado -->
    <div
      class="pointer-events-none absolute left-0 top-0 h-full rounded-2xl bg-white shadow transition-transform duration-300 ease-out"
      :style="indicatorStyle"
      aria-hidden="true"
    ></div>

    <button
      v-for="(item, idx) in items"
      :key="item.value"
      :ref="(el) => setItemRef(el as HTMLButtonElement | null, idx)"
      type="button"
      class="focus-visible:ring-primary-700 relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :class="[
        sizeClasses.btn,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        item.value === modelValue
          ? 'text-primary-800'
          : 'text-grey-500 hover:text-grey-700',
      ]"
      role="tab"
      :aria-selected="item.value === modelValue"
      :tabindex="item.value === modelValue ? 0 : -1"
      :disabled="disabled"
      @click="select(item.value)"
    >
      <component
        :is="`icon-${item.icon}`"
        v-if="item.icon"
        :font-controlled="false"
        :class="sizeClasses.icon"
      />

      <span class="whitespace-nowrap font-medium">
        {{ item.label }}
      </span>
    </button>
  </div>
</template>
