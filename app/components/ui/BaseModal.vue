<script lang="ts" setup>
interface IModalProps {
  show?: boolean;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

defineOptions({
  name: 'Modal',
});

const props = withDefaults(defineProps<IModalProps>(), {
  show: false,
  title: 'Título do Modal',
  size: 'medium',
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
}>();

const modalRef = useTemplateRef('modal');

const controlFocusableElements = (event: KeyboardEvent) => {
  if (modalRef.value) {
    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement?.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement?.focus();
      event.preventDefault();
    }
  }
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show) {
    closeModal();
  }
};

watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        modalRef.value?.querySelector('h3')?.focus();
        document.addEventListener('keydown', controlFocusableElements);
        document.addEventListener('keydown', handleEscapeKey);
      });
    } else {
      document.removeEventListener('keydown', controlFocusableElements);
      document.removeEventListener('keydown', handleEscapeKey);
    }
  },
);

const closeModal = (): void => {
  document.removeEventListener('keydown', controlFocusableElements);
  emit('closeModal');
};

onMounted(() => {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.show) {
      closeModal();
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', controlFocusableElements);
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>
<template>
  <transition name="fade">
    <div
      v-if="show"
      ref="modal"
      role="dialog"
      :aria-labelledby="title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex min-h-screen items-start justify-center overflow-y-auto overflow-x-hidden"
      data-test-id="modal"
      @keyup.esc="closeModal"
      @keydown.esc="closeModal"
    >
      <!-- Modal Overlay -->
      <div class="bg-primary-800/25 fixed inset-0"></div>

      <!-- Modal Container -->
      <div
        class="slide-down fixed inset-x-0 top-0 mx-3"
        :class="['max-h-[calc(100vh-24px)]']"
      >
        <div
          class="relative mx-auto mt-3 rounded bg-white px-3 pb-6 pt-3 shadow-xl"
          :class="{
            'w-full max-w-md': size === 'small',
            'w-full max-w-2xl': size === 'medium',
            'w-full max-w-4xl': size === 'large',
          }"
        >
          <!-- Modal Title -->
          <div class="flex items-center justify-between py-3">
            <h3
              tabindex="-1"
              class="text-grey-800 text-lg font-bold md:text-2xl"
            >
              {{ title }}
            </h3>

            <button
              class="mx-4"
              data-test-id="modal-close-button"
              @click="closeModal"
              @keyup.enter="$emit('closeModal')"
            >
              <svg
                class="hover:text-primary-700 h-6 w-6 text-gray-500 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Modal Content -->
          <div class="max-h-[calc(100vh-120px)] overflow-y-auto px-3 py-3">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
