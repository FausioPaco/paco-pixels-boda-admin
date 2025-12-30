<script setup lang="ts" generic="TItem extends Record<string, unknown>">
defineOptions({
  name: 'BaseAutoCompleteInput',
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    id: string;
    label?: string;
    modelValue: string;
    placeholder?: string;
    helperText?: string;
    errorMessage?: string;
    disabled?: boolean;
    readonly?: boolean;
    disableMargins?: boolean;
    items: TItem[];
    itemLabel: keyof TItem & string;
    itemKey: keyof TItem & string;
    loading?: boolean;
    noResultsText?: string;
    minChars?: number;
  }>(),
  {
    label: '',
    placeholder: '',
    helperText: '',
    errorMessage: '',
    disabled: false,
    readonly: false,
    disableMargins: false,
    loading: false,
    noResultsText: 'Sem resultados.',
    minChars: 2,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue' | 'search', v: string): void;
  (e: 'select', item: TItem): void;
  (e: 'open' | 'close'): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const listboxId = computed(() => `${props.id}-listbox`);
const optionId = (index: number) => `${props.id}-opt-${index}`;

const isOpen = ref(false);
const activeIndex = ref<number>(-1);

const hasQuery = computed(
  () => (props.modelValue ?? '').trim().length >= props.minChars!,
);
const hasItems = computed(() => (props.items?.length ?? 0) > 0);

const showList = computed(() => {
  if (!isOpen.value) return false;
  if (!hasQuery.value) return false;
  return props.loading || hasItems.value || true; // para mostrar "Sem resultados"
});

const activeDescendant = computed(() => {
  if (!showList.value) return undefined;
  if (activeIndex.value < 0) return undefined;
  if (!props.items?.[activeIndex.value]) return undefined;
  return optionId(activeIndex.value);
});

const open = () => {
  if (props.disabled || props.readonly) return;
  if (isOpen.value) return;
  isOpen.value = true;
  activeIndex.value = -1;
  emit('open');
};

const close = () => {
  if (!isOpen.value) return;
  isOpen.value = false;
  activeIndex.value = -1;
  emit('close');
};

const getLabel = (item: TItem): string => {
  return String(item[props.itemLabel]);
};

const getKey = (item: TItem): string => {
  return String(item[props.itemKey]);
};

const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  emit('update:modelValue', value);

  // Só dispara pesquisa quando tem minChars
  if (value.trim().length >= props.minChars!) {
    open();
    emit('search', value.trim());
  } else {
    close();
  }
};

const moveActive = (delta: number) => {
  if (!showList.value) return;

  const count = props.items?.length ?? 0;
  if (count <= 0) {
    activeIndex.value = -1;
    return;
  }

  let next = activeIndex.value + delta;
  if (next < 0) next = count - 1;
  if (next >= count) next = 0;

  activeIndex.value = next;
};

const selectAt = (index: number) => {
  const item = props.items?.[index];
  if (!item) return;

  const label = getLabel(item);
  emit('update:modelValue', label);
  emit('select', item);

  // mantém o foco no input para continuidade
  nextTick(() => inputRef.value?.focus());
  close();
};

const onKeydown = (e: KeyboardEvent) => {
  if (props.disabled || props.readonly) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      open();
      moveActive(+1);
      break;

    case 'ArrowUp':
      e.preventDefault();
      open();
      moveActive(-1);
      break;

    case 'Enter':
      if (showList.value && activeIndex.value >= 0) {
        e.preventDefault();
        selectAt(activeIndex.value);
      }
      break;

    case 'Escape':
      if (isOpen.value) {
        e.preventDefault();
        close();
      }
      break;

    case 'Home':
      if (showList.value && (props.items?.length ?? 0) > 0) {
        e.preventDefault();
        activeIndex.value = 0;
      }
      break;

    case 'End':
      if (showList.value && (props.items?.length ?? 0) > 0) {
        e.preventDefault();
        activeIndex.value = (props.items?.length ?? 1) - 1;
      }
      break;

    case 'Tab':
      // fecha ao sair, sem bloquear navegação
      close();
      break;
  }
};

const onFocus = () => {
  if (props.disabled || props.readonly) return;

  // se já existe query suficiente e já há items (ou loading), abre ao focar
  if ((props.modelValue ?? '').trim().length >= props.minChars) {
    open();
  }
};

const onBlur = (e: FocusEvent) => {
  // não fechar imediatamente se o blur foi para dentro do próprio componente (ex: click em item)
  const next = e.relatedTarget as HTMLElement | null;
  if (next && rootRef.value?.contains(next)) return;

  // pequeno delay para permitir click no item
  window.setTimeout(() => close(), 120);
};

const onOptionMouseEnter = (index: number) => {
  activeIndex.value = index;
};

const onOptionMouseDown = (e: MouseEvent) => {
  // impede perder foco no input antes do select
  e.preventDefault();
};

const onOptionClick = (index: number) => {
  selectAt(index);
};

// fechar ao clicar fora
const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as Node | null;
  if (!target) return;
  if (!rootRef.value) return;
  if (!rootRef.value.contains(target)) close();
};

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<template>
  <div ref="rootRef" :class="disableMargins ? '' : 'my-4'">
    <label
      v-if="label"
      :for="id"
      class="text-label text-grey-800 mb-1 block text-sm font-medium"
      >{{ label }}</label
    >

    <div class="relative">
      <input
        :id="id"
        ref="inputRef"
        v-bind="$attrs"
        class="form-control"
        :placeholder="placeholder || label"
        :value="modelValue"
        :disabled="disabled"
        :readonly="readonly"
        :class="{
          'border-danger-600': errorMessage,
          'border-grey-200': !errorMessage,
        }"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="showList ? true : false"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        :aria-invalid="errorMessage ? true : undefined"
        :aria-describedby="
          errorMessage
            ? `${id}-errorMessage`
            : helperText
              ? `${id}-helperText`
              : ''
        "
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />

      <div
        v-if="showList"
        class="border-grey-200 absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow-lg"
      >
        <ul :id="listboxId" role="listbox" class="max-h-60 overflow-auto py-1">
          <li
            v-if="loading"
            class="text-grey-400 px-3 py-2 text-sm"
            role="option"
            aria-selected="false"
          >
            A procurar...
          </li>

          <li
            v-else-if="!hasItems"
            class="text-grey-400 px-3 py-2 text-sm"
            role="option"
            aria-selected="false"
          >
            {{ noResultsText }}
          </li>

          <li
            v-for="(item, index) in items"
            v-else
            :id="optionId(index)"
            :key="getKey(item) + '-' + index"
            role="option"
            :aria-selected="index === activeIndex ? 'true' : 'false'"
            class="cursor-pointer px-3 py-2 text-sm"
            :class="index === activeIndex ? 'bg-primary-100' : ''"
            tabindex="-1"
            @mouseenter="onOptionMouseEnter(index)"
            @mousedown="onOptionMouseDown"
            @click="onOptionClick(index)"
          >
            {{ getLabel(item) }}
          </li>
        </ul>
      </div>
    </div>

    <small
      v-if="helperText"
      :id="`${id}-helperText`"
      class="text-label text-grey-600 mt-2 block truncate text-xs font-medium"
    >
      {{ helperText }}
    </small>

    <BaseInputError v-if="errorMessage" :id="id">{{
      errorMessage
    }}</BaseInputError>
  </div>
</template>
