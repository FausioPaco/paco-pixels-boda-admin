<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getGuestService } from '~/services/guestService';

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
    toast.success('Chegada confirmada.');
    emit('success');
    close();
  } catch (err: unknown) {
    onError(err, 'Ocorreu um erro ao confirmar chegada');
  } finally {
    isSubmitting.value = false;
  }
};

const cancelArrival = async () => {
  if (!props.guest) return;

  try {
    isSubmitting.value = true;
    await guestService.cancelArrival(props.guest.id);
    toast.success('Chegada cancelada.');
    emit('success');
    close();
  } catch (err: unknown) {
    onError(err, 'Ocorreu um erro ao cancelar chegada');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <BaseModal :show="show" title="Chegada" @close-modal="close">
    <div v-if="guest" class="space-y-4">
      <div class="bg-grey-50 rounded-xl p-3">
        <div class="text-grey-900 text-lg font-semibold">
          {{ guest.name }}
        </div>
        <div class="text-grey-700 text-sm">
          {{
            guest.people_Count === 1
              ? '1 pessoa'
              : `${guest.people_Count} pessoas`
          }}
        </div>
      </div>

      <div
        v-if="guest.absence_Declared"
        class="bg-warning-50 rounded-xl p-3 text-sm"
      >
        Este convidado está marcado como ausente. A chegada está desactivada.
      </div>

      <div class="flex justify-end gap-2">
        <BaseButton
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click="close"
        >
          Fechar
        </BaseButton>

        <BaseButton
          v-if="!guest.arrived"
          btn-type="primary"
          :disabled="isSubmitting || !!guest.absence_Declared"
          @click="confirmArrival"
        >
          Confirmar chegada
        </BaseButton>

        <BaseButton
          v-else
          btn-type="outline-primary"
          :disabled="isSubmitting || !!guest.absence_Declared"
          @click="cancelArrival"
        >
          Cancelar chegada
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
