<script lang="ts" setup>
defineOptions({
  name: 'BaseInputGroup',
  inheritAttrs: false,
});

interface IInputGroupProps {
  id: string;
  label: string;
  placeholder?: string;
  addon?: string;
  modelValue: string | number | undefined;
  helperText?: string;
  error?: string;
  success?: boolean;
  info?: boolean;
  warning?: boolean;
  disableEmpty?: boolean;
  position?: 'left' | 'right';
  errorMessage?: string;
}

withDefaults(defineProps<IInputGroupProps>(), {
  placeholder: '',
  addon: 'FS-',
  helperText: '',
  error: '',
  success: false,
  info: false,
  warning: false,
  disableEmpty: false,
  position: 'left',
  errorMessage: '',
});

const emit = defineEmits(['update:modelValue']);

const updateInput = ($event: Event) => {
  const inputData = $event.target as HTMLInputElement;
  emit('update:modelValue', inputData.value);
};
</script>

<template>
  <div class="my-4">
    <label
      v-if="label"
      :for="id"
      class="text-label text-grey-800 mb-2 block truncate text-sm font-medium"
      >{{ label }}</label
    >

    <div class="input-group">
      <div v-if="position === 'left'" class="input-group-addon left">
        <span>{{ addon }}</span>
      </div>

      <input
        :id="id"
        v-bind="$attrs"
        :placeholder="placeholder || label"
        class="form-control"
        :value="modelValue"
        :class="{
          'border-2 border-red-600': error,
          'border-2 border-green-600': success,
          'border-2 border-blue-600': info,
          'border-2 border-yellow-400': warning,
          'border-grey-200': !errorMessage && !success && !info && !warning,
        }"
        :aria-describedby="error ? `${id}-error` : ''"
        :aria-invalid="error ? true : undefined"
        @input="updateInput"
      />

      <div v-if="position === 'right'" class="input-group-addon right">
        <span>{{ addon }}</span>
      </div>
    </div>

    <small
      v-if="helperText"
      class="text-label text-grey-600 block truncate text-xs font-medium"
    >
      {{ helperText }}
    </small>

    <BaseInputError v-if="error" :id="id">{{ error }}</BaseInputError>
  </div>
</template>

<style>
.input-group {
  display: flex;
  align-items: stretch;
  position: relative;
  width: 100%;
}

.input-group-addon.left {
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
}

.input-group-addon.right {
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.input-group > .form-control:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group > .form-control:not(:first-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.input-group-addon {
  padding: 0.4rem 0.9rem;
  @apply bg-primary-500 flex items-center justify-center text-white;
}
</style>
