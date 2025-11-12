<script lang="ts" setup>
interface IAlertProps {
  show?: boolean;
  title?: string;
  message?: string;
  type?: 'informative' | 'success' | 'warning' | 'error';
}

defineOptions({
  name: 'BaseAlert',
});

const props = withDefaults(defineProps<IAlertProps>(), {
  show: false,
  title: '',
  message: '',
  type: 'error',
});

const ICON_ALERT_STATES = {
  informative: 'IconInformation',
  success: 'IconCheckmark',
  warning: 'IconWarning',
  error: 'IconWarning',
} as const;

const emit = defineEmits(['close']);

const closeAlert = () => {
  emit('close');
};

const alert = useTemplateRef('alert');
const setFocusOnAlert = () => {
  alert.value?.focus();
};

watch(
  () => props.show,
  (newVal) => {
    if (newVal) setFocusOnAlert();
  },
);
</script>
<template>
  <div
    v-if="show"
    ref="alert"
    class="text-grey-800 flex w-full animate-fadeIn items-start gap-x-3 rounded p-3"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    tabindex="-1"
    :class="{
      'bg-primary-50': type === 'informative',
      'bg-success-50': type === 'success',
      'bg-warning-50': type === 'warning',
      'bg-danger-50': type === 'error',
    }"
  >
    <component
      :is="ICON_ALERT_STATES[props.type]"
      :font-controlled="false"
      width="24"
      height="24"
      class="inline-block"
      :class="{
        'text-primary-700': type === 'informative',
        'text-success-700': type === 'success',
        'text-warning-700': type === 'warning',
        'text-danger-700': type === 'error',
      }"
    />
    <div class="flex flex-1 flex-col gap-y-2 pt-0.5">
      <h4 v-if="title" class="text-grey-800 text-base font-semibold">
        {{ title }}
      </h4>
      <p class="text-grey-800 text-sm">{{ message }}</p>
    </div>
    <button
      data-test-id="close-button"
      aria-label="Fechar alerta"
      class="text-grey-700 hover:text-grey-800 transition-colors"
      @click="closeAlert"
    >
      ✕
    </button>
  </div>
</template>
