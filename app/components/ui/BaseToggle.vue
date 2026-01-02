<script setup lang="ts">
type ToggleSize = 'sm' | 'md' | 'lg';

interface Props {
  modelValue?: boolean | undefined;
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  size?: ToggleSize;

  // útil quando queres texto contextual (ex: Controlo / Sem controlo)
  onText?: string;
  offText?: string;
  showStateText?: boolean;

  // quando queres label do lado direito em vez de esquerda
  reverse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  required: false,
  id: 'toggle',
  label: '',
  description: '',
  name: '',
  hint: '',
  size: 'md',
  error: '',
  onText: 'Activado',
  offText: 'Desactivado',
  showStateText: false,
  reverse: false,
  modelValue: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', v: boolean): void;
}>();

const inputId = computed(
  () => props.id ?? `toggle-${Math.random().toString(16).slice(2)}`,
);

const hasText = computed(() => !!props.label || !!props.description);

const onToggle = () => {
  if (props.disabled || props.loading) return;
  const next = !props.modelValue;
  emit('update:modelValue', next);
  emit('change', next);
};

const containerClass = computed(() =>
  props.reverse ? 'flex-row-reverse' : 'flex-row',
);

const toggleClass = computed(() => {
  const base = [];
  const hasError = !!props.error;

  // sizes
  if (props.size === 'sm') base.push('h-5 w-9 p-0.5');
  if (props.size === 'md') base.push('h-6 w-11 p-0.5');
  if (props.size === 'lg') base.push('h-7 w-14 p-0.5');

  // states
  if (props.disabled || props.loading)
    base.push('opacity-60 cursor-not-allowed');
  else base.push('cursor-pointer');

  if (props.modelValue) base.push('bg-primary-700');
  else base.push('bg-grey-100');

  // error ring (subtil)
  if (hasError) base.push('ring-2 ring-red-200');

  return base.join(' ');
});

const thumbClass = computed(() => {
  const base = [];

  if (props.size === 'sm') base.push('h-4 w-4');
  if (props.size === 'md') base.push('h-5 w-5');
  if (props.size === 'lg') base.push('h-6 w-6');

  base.push(props.modelValue ? 'translate-x-5' : 'translate-x-0'); // default md
  if (props.size === 'sm')
    base.splice(
      base.indexOf('translate-x-5'),
      1,
      props.modelValue ? 'translate-x-4' : 'translate-x-0',
    );
  if (props.size === 'lg')
    base.splice(
      base.indexOf('translate-x-5'),
      1,
      props.modelValue ? 'translate-x-7' : 'translate-x-0',
    );

  return base.join(' ');
});
</script>
<template>
  <div class="w-full">
    <div class="flex items-start justify-between gap-4" :class="containerClass">
      <!-- label + description -->
      <div v-if="hasText" class="min-w-0">
        <label v-if="label" class="text-grey-900 block text-sm" :for="inputId">
          <span v-if="required" class="text-red-600">*</span>
          <slot name="label">{{ label }}</slot>
        </label>

        <p v-if="description" class="text-grey-500 mt-1 text-xs">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>

      <!-- toggle -->
      <button
        :id="inputId"
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :aria-disabled="disabled || loading"
        :disabled="disabled || loading"
        class="focus:ring-primary-900/20 relative inline-flex shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2"
        :class="toggleClass"
        @click="onToggle"
        @keydown.enter.prevent="onToggle"
        @keydown.space.prevent="onToggle"
      >
        <!-- track text (optional) -->
        <span v-if="showStateText" class="sr-only">
          {{ modelValue ? onText : offText }}
        </span>

        <!-- thumb -->
        <span
          class="pointer-events-none inline-flex items-center justify-center rounded-full bg-white shadow-sm transition"
          :class="thumbClass"
        >
          <svg
            v-if="loading"
            class="text-primary-500 h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
            />
          </svg>
        </span>
      </button>
    </div>

    <!-- hint / error -->
    <p v-if="hint && !error" class="text-primary-500 mt-1 text-xs">
      <slot name="hint">{{ hint }}</slot>
    </p>

    <p v-if="error" class="mt-1 text-xs text-red-600">
      {{ error }}
    </p>
  </div>
</template>
