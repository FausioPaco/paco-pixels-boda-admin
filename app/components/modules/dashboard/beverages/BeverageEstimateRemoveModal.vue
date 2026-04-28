<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';
import { isFetchErrorLike } from '~/utils/serverUtils';

type Props = {
  show?: boolean;
  eventId: number;
  estimate?: EventBeverageEstimate | undefined | null;
  moduleStatus: EventBeverageStatus;
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  estimate: undefined,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const { t } = useI18n();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isSubmitting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const isBlocked = computed(
  () => props.moduleStatus === 'EventDay' || props.moduleStatus === 'Closed',
);

const onSubmit = async () => {
  if (!props.estimate) return;
  if (isBlocked.value) return;

  try {
    isSubmitting.value = true;
    await beverageService.removeEventBeverageEstimate(
      props.eventId,
      props.estimate.id,
    );

    toast.success(t('beverages.toast_estimate_removed_success'));
    emit('success');
  } catch (e) {
    console.error(e);
    if (isFetchErrorLike(e)) {
      serverErrors.value.message = getServerErrors(e.data);
    } else {
      serverErrors.value.message = t('beverages.toast_estimate_removed_error');
    }
    serverErrors.value.hasErrors = true;
  } finally {
    isSubmitting.value = false;
  }
};

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="t('beverages.remove_modal_title_estimate')"
    @close-modal="close"
  >
    <div class="space-y-4">
      <BaseAlert
        v-if="props.estimate?.confirmed"
        :show="props.estimate?.confirmed"
        :title="t('beverages.estimate_remove_confirm_title')"
        :message="t('beverages.estimate_remove_confirm_message')"
        type="informative"
      />

      <p class="text-grey-700">
        {{ t('beverages.remove_confirm_estimate_prefix') }}
        <span class="text-grey-900 font-bold">{{
          props.estimate?.name ?? '-'
        }}</span
        >?
      </p>

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-1"
          size="md"
          :disabled="isSubmitting || isBlocked"
          :loading="isSubmitting"
          @click="onSubmit"
        >
          {{ t('beverages.button_remove_now') }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="isSubmitting"
          @click="$emit('closeModal')"
        >
          {{ t('common.cancel') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
