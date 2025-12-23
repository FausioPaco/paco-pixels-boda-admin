<script lang="ts" setup>
defineOptions({
  name: 'BaseTextArea',
  inheritAttrs: false,
});

interface ITextareaProps {
  id: string;
  label?: string;
  placeholder?: string;
  modelValue: string | number | undefined | null;
  helperText?: string;
  errorMessage?: string;
  success?: boolean;
  info?: boolean;
  warning?: boolean;
  disableEmpty?: boolean;
}

withDefaults(defineProps<ITextareaProps>(), {
  placeholder: '',
  helperText: '',
  label: '',
  errorMessage: '',
  success: false,
  info: false,
  warning: false,
  disableEmpty: false,
});

const emit = defineEmits(['update:modelValue']);

const updateInput = ($event: Event) => {
  const inputData = $event.target as HTMLTextAreaElement;
  emit('update:modelValue', inputData.value);
};
</script>

<template>
  <div class="my-4">
    <label
      v-if="label"
      :for="id"
      class="text-label mb-1 block truncate text-sm font-medium text-gray-800"
      >{{ label }}</label
    >
    <textarea
      :id="id"
      v-bind="$attrs"
      :placeholder="placeholder || label"
      class="form-control"
      :value="modelValue"
      :class="{
        'border-danger-600': errorMessage,
        'border-primary-600': success,
        'border-purple-600': info,
        'border-warning-600': warning,
        'border-grey-200': !errorMessage && !success && !info && !warning,
      }"
      :aria-describedby="errorMessage ? `${id}-error` : ''"
      :aria-invalid="errorMessage ? true : undefined"
      @input="updateInput"
    ></textarea>

    <small
      v-if="helperText"
      class="text-label block truncate text-xs font-medium text-gray-600"
    >
      {{ helperText }}
    </small>

    <BaseInputError v-if="errorMessage" :id="id">{{
      errorMessage
    }}</BaseInputError>
  </div>
</template>
