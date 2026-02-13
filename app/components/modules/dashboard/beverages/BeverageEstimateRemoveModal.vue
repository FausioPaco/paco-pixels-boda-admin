<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

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

    toast.success('Estimativa removida com sucesso');
    emit('success');
  } catch (e) {
    console.error(e);
    if (isFetchErrorLike(e)) {
      serverErrors.value.message = getServerErrors(e.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao remover a estimativa';
    }
    serverErrors.value.hasErrors = true;
  } finally {
    isSubmitting.value = false;
  }
};

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal :show="props.show" title="Remover estimativa" @close-modal="close">
    <div class="space-y-4">
      <BaseAlert
        v-if="props.estimate?.confirmed"
        :show="props.estimate?.confirmed"
        title="Atenção: esta estimativa está confirmada."
        message="Ao remover, a bebida criada no inventário e os movimentos de stock  associados serão também removidos"
        type="informative"
      />

      <p class="text-grey-700">
        Tem a certeza que pretende remover a estimativa
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
          Remover agora
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="isSubmitting"
          @click="$emit('closeModal')"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
