<script setup lang="ts">
interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'send'): void;
}>();

const isSubmitting = ref(false);
const { t } = useI18n();

const onSubmit = () => {
  isSubmitting.value = true;

  emit('send');

  setTimeout(() => {
    isSubmitting.value = false;
  }, 200);
};
</script>

<template>
  <BaseModal
    :title="t('guests.send_all_inv_title')"
    :show="show"
    @close-modal="emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn">
      <form class="space-y-3" @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          {{ t('guests.send_all_inv_desc') }}
        </p>

        <p class="text-grey-500 text-xs">
          {{ t('guests.send_all_inv_note') }}
        </p>

        <div class="my-4 flex items-center justify-center gap-3">
          <BaseButton
            type="submit"
            btn-type="primary"
            class="my-1"
            size="md"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            {{ t('guests.send_all_inv_submit') }}
          </BaseButton>

          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="my-1"
            size="md"
            @click="emit('closeModal')"
          >
            {{ t('common.cancel') }}
          </BaseButton>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
