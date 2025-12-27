<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    eventId: number;
    beverage?: EventBeverage | undefined | null;
  }>(),
  { show: false, beverage: undefined },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isSubmiting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const onSubmit = async () => {
  if (!props.beverage) return;

  try {
    isSubmiting.value = true;
    await beverageService.removeEventBeverage(props.eventId, props.beverage.id);
    toast.success('Bebida removida com sucesso');
    emit('success');
  } catch (e) {
    console.error(e);
    if (isFetchErrorLike(e)) {
      serverErrors.value.message = getServerErrors(e.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao remover a bebida';
    }

    serverErrors.value.hasErrors = true;
  } finally {
    isSubmiting.value = false;
  }
};

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal :show="props.show" title="Remover bebida" @close-modal="close">
    <div class="space-y-4">
      <p class="text-grey-700">
        Tem a certeza que pretende remover a bebida
        <span class="text-grey-900 font-bold">{{
          props.beverage?.name ?? '-'
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
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onSubmit"
        >
          Remover agora
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="isSubmiting"
          @click="$emit('closeModal')"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
