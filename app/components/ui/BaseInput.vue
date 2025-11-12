<script setup lang="ts">
defineOptions({
  name: 'BaseInput',
  inheritAttrs: false,
});

withDefaults(defineProps<IInputProps>(), {
  placeholder: '',
  helperText: '',
  errorMessage: '',
  success: false,
  info: false,
  warning: false,
  disableEmpty: false,
  disableMargins: false,
});

const emit = defineEmits(['update:modelValue']);

const updateInput = ($event: Event) => {
  const inputData = $event.target as HTMLInputElement;
  emit('update:modelValue', inputData.value);
};
</script>
<template>
  <div :class="disableMargins ? '' : 'my-4'">
    <label
      v-if="label"
      :for="id"
      class="text-label text-grey-800 mb-1 block text-sm font-medium"
      >{{ label }}</label
    >
    <input
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
      :aria-describedby="errorMessage ? `${id}-errorMessage` : ''"
      :aria-invalid="errorMessage ? true : undefined"
      @input="updateInput"
    />

    <small
      v-if="helperText"
      class="text-label text-grey-600 mt-2 block truncate text-xs font-medium"
    >
      {{ helperText }}
    </small>

    <BaseInputError v-if="errorMessage" :id="id">{{
      errorMessage
    }}</BaseInputError>
  </div>
</template>
