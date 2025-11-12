<script lang="ts" setup>
defineOptions({
  name: 'BaseCheckbox',
  inheritAttrs: false,
});

interface ICheckboxProps {
  id: string | number;
  label?: string;
  modelValue?: boolean;
  error?: string;
  success?: boolean;
  info?: boolean;
  warning?: boolean;
  disableEmpty?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<ICheckboxProps>(), {
  modelValue: false,
  error: '',
  label: '',
  success: false,
  info: false,
  warning: false,
  disableEmpty: false,
  disabled: false,
});

const emit = defineEmits(['update:modelValue', 'update:error']);

const updateInput = ($event: Event) => {
  const inputData = $event.target as HTMLInputElement;
  emit('update:modelValue', inputData.checked);
};
</script>

<template>
  <div class="my-3 block">
    <div class="relative">
      <input
        :id="id.toString()"
        type="checkbox"
        v-bind="$attrs"
        :checked="modelValue"
        :disabled="disabled"
        :class="{
          'accent-red-600': error,
          'accent-success-600': success,
          'accent-blue-600': info,
          'text-white accent-yellow-400': warning,
        }"
        :aria-describedby="error ? `${id}-error` : ''"
        :aria-invalid="error ? true : undefined"
        @change="updateInput"
      />
      <label class="label-checkbox" :for="id.toString()">
        {{ label }}
      </label>
      <slot></slot>
    </div>

    <BaseInputError v-if="error" :id="id">{{ error }}</BaseInputError>
  </div>
</template>

<style>
input[type='checkbox'] {
  @apply focus:border-success-700 mb-0 cursor-pointer appearance-none p-0;
}

.label-checkbox {
  @apply text-grey-800 relative cursor-pointer text-base;
}

.label-checkbox:before {
  content: '';
  @apply border-grey-500 relative mb-0.5 mr-2 inline-block cursor-pointer appearance-none rounded border-2 bg-transparent p-2.5 align-middle shadow-sm transition-all duration-300 ease-in;
}

input[type='checkbox']:disabled + .label-checkbox:before {
  @apply bg-grey-100/70;
}

input[type='checkbox']:checked + .label-checkbox:after {
  content: '';
  @apply absolute left-2 top-1 block h-[14px] w-[6px] rotate-45 border-b-2 border-r-2 border-white;
}

input[type='checkbox']:checked + .label-checkbox:before {
  @apply border-success-600 bg-success-600 scale-100;
}
</style>
