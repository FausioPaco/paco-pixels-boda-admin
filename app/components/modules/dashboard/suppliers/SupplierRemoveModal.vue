<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getSupplierService } from '~/services/supplierService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    eventId: number;
    supplier?: Supplier | undefined | null;
  }>(),
  { show: false, supplier: undefined },
);

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const supplierService = getSupplierService(nuxtApp.$api);
const { refreshIds } = await useEventSupplierCatalogItemIds(props.eventId);

const isSubmiting = ref(false);
const serverErrors = ref<ServerError>({ hasErrors: false, message: '' });

const onSubmit = async () => {
  if (!props.supplier) return;

  try {
    isSubmiting.value = true;
    await supplierService.removeSupplier(Number(props.supplier.id));
    refreshIds({ force: true });
    toast.success('Fornecedor removido com sucesso');
    emit('success');
  } catch (e) {
    console.error(e);
    serverErrors.value.message = isFetchErrorLike(e)
      ? getServerErrors(e.data)
      : 'Ocorreu um erro ao remover o fornecedor';
    serverErrors.value.hasErrors = true;
  } finally {
    isSubmiting.value = false;
  }
};

const close = () => emit('closeModal');
</script>

<template>
  <BaseModal :show="props.show" title="Remover fornecedor" @close-modal="close">
    <div class="space-y-4">
      <p class="text-grey-700">
        Tem a certeza que pretende remover o fornecedor
        <span class="text-grey-900 font-bold">{{
          props.supplier?.name ?? '-'
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
