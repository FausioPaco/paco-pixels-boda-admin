<script lang="ts" setup>
import type { ISelectProps } from '#shared/types/select';
defineOptions({
  name: 'BaseSelect',
  inheritAttrs: false,
});

const props = withDefaults(defineProps<ISelectProps>(), {
  helperText: '',
  errorMessage: '',
  success: false,
  info: false,
  warning: false,
  disableEmpty: false,
  emptyMessage: 'Selecione',
  background: 'white',
  disableMargins: false,
  asNumber: false,
});

const emit = defineEmits(['update:modelValue']);

const updateValue = ($event: Event) => {
  const { value } = $event.target as HTMLSelectElement;

  if (props.asNumber) {
    emit('update:modelValue', value === '' ? value : Number(value));
    return;
  }

  emit('update:modelValue', value);
};
</script>
<template>
  <div :class="disableMargins ? '' : 'my-4'">
    <label
      v-if="label"
      :for="id"
      class="text-label mb-1 block text-left text-sm font-medium"
      :class="background === 'white' ? 'text-grey-800' : 'text-white'"
      >{{ label }}</label
    >
    <select
      :id="id"
      :name="id"
      :value="modelValue"
      v-bind="{
        ...$attrs,
        onChange: updateValue,
      }"
      :class="{
        'border-danger-600': errorMessage,
        'border-primary-600': success,
        'border-blue-600': info,
        'border-yellow-600': warning,
        'border-grey-200': !errorMessage && !success && !info && !warning,
      }"
      class="form-control"
      :aria-describedby="errorMessage ? `${id}-error` : undefined"
      :aria-invalid="errorMessage ? true : undefined"
    >
      <option v-if="!disableEmpty" key="" value="">{{ emptyMessage }}</option>
      <option
        v-for="option in options"
        :key="option.id"
        :value="option.id"
        :selected="option.id === modelValue"
      >
        {{ option.name }}
      </option>
    </select>
    <small
      v-if="helperText"
      class="text-label text-grey-800 mt-1 block text-xs font-medium"
    >
      {{ helperText }}
    </small>
    <BaseInputError v-if="errorMessage" :id="`${id}-error`">
      {{ errorMessage }}</BaseInputError
    >
  </div>
</template>
