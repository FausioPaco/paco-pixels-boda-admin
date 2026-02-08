<script setup lang="ts">
type Align = 'left' | 'right' | 'center';

type Props = {
  id?: string;
  modelValue: string | number | null | undefined;
  type?: 'text' | 'number';
  placeholder?: string;
  step?: string | number;
  min?: string | number;
  max?: string | number;
  align?: Align;
  disabled?: boolean;
  readonly?: boolean;
  errorMessage?: string | null;
};

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  type: 'text',
  placeholder: '',
  step: '0.01',
  align: 'left',
  disabled: false,
  readonly: false,
  min: 0,
  max: 100,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void;
  (e: 'blur' | 'enter'): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const onInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value;

  if (props.type === 'number') {
    // mantém string vazia como null (para permitir apagar o campo)
    if (raw === '') return emit('update:modelValue', null);

    const n = Number(raw);
    return emit('update:modelValue', Number.isFinite(n) ? n : null);
  }

  emit('update:modelValue', raw);
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') emit('enter');
};

const alignClass = computed(() => {
  if (props.align === 'right') return 'text-right';
  if (props.align === 'center') return 'text-center';
  return 'text-left';
});

const baseClass =
  'w-full rounded-md border px-2 py-1 text-sm transition ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-300 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed ' +
  'readonly:bg-grey-50 readonly:opacity-90';

const borderClass = computed(() =>
  props.errorMessage ? 'border-red-400 focus:ring-red-200' : 'border-grey-200',
);

const describedBy = computed(() =>
  props.errorMessage && props.id ? `${props.id}-error` : undefined,
);

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<template>
  <div class="w-full">
    <input
      :id="id"
      ref="inputRef"
      :type="type"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :step="type === 'number' ? step : undefined"
      :min="type === 'number' ? min : undefined"
      :max="type === 'number' ? max : undefined"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="!!errorMessage"
      :aria-describedby="describedBy"
      :class="[baseClass, borderClass, alignClass]"
      @input="onInput"
      @blur="emit('blur')"
      @keydown="onKeydown"
    />

    <p
      v-if="errorMessage && id"
      :id="`${id}-error`"
      class="mt-1 text-xs text-red-600"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
