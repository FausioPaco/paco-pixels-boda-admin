<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getGuestService } from '~/services/guestService';
import { isFetchErrorLike } from '~/utils/serverUtils';

type Props = {
  show: boolean;
  guest: Guest | undefined;
};

type Emits = {
  (e: 'close-modal' | 'success'): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const { t } = useI18n();
const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const isSubmitting = ref(false);

const close = () => emit('close-modal');

const onError = (err: unknown, fallbackMessage: string) => {
  if (isFetchErrorLike(err)) {
    toast.error(getServerErrors(err?.data));
    return;
  }
  toast.error(fallbackMessage);
};

const confirmArrival = async () => {
  if (!props.guest) return;

  try {
    isSubmitting.value = true;
    await guestService.confirmArrival(props.guest.id);
    toast.success(t('guests.arrived_confirmed_success'));
    emit('success');
    close();
  } catch (err: unknown) {
    onError(err, t('guests.arrived_confirm_error'));
  } finally {
    isSubmitting.value = false;
  }
};

const cancelArrival = async () => {
  if (!props.guest) return;

  try {
    isSubmitting.value = true;
    await guestService.cancelArrival(props.guest.id);
    toast.success(t('guests.arrived_cancelled_success'));
    emit('success');
    close();
  } catch (err: unknown) {
    onError(err, t('guests.arrived_cancel_error'));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('guests.arrived_title')"
    @close-modal="close"
  >
    <div v-if="guest" class="space-y-4">
      <div class="bg-grey-50 rounded-xl p-3">
        <div class="text-grey-900 text-lg font-semibold">
          {{ guest.name }}
        </div>
        <div class="text-grey-700 text-sm">
          {{
            guest.people_Count === 1
              ? t('guests.manage_people_one')
              : t('guests.manage_people_other', { n: guest.people_Count })
          }}
        </div>
      </div>

      <div
        v-if="guest.absence_Declared"
        class="bg-warning-50 rounded-xl p-3 text-sm"
      >
        {{ t('guests.arrived_absence_warning') }}
      </div>

      <div class="flex justify-end gap-2">
        <BaseButton
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click="close"
        >
          {{ t('guests.arrived_close') }}
        </BaseButton>

        <BaseButton
          v-if="!guest.arrived"
          btn-type="primary"
          :disabled="isSubmitting || !!guest.absence_Declared"
          :loading="isSubmitting"
          @click="confirmArrival"
        >
          {{ t('guests.arrived_confirm') }}
        </BaseButton>

        <BaseButton
          v-else
          btn-type="outline-primary"
          :disabled="isSubmitting || !!guest.absence_Declared"
          :loading="isSubmitting"
          @click="cancelArrival"
        >
          {{ t('guests.arrived_cancel_btn') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
