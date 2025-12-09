<script setup lang="ts">
import type { ExportListFormat } from '~~/shared/types/guest';

interface IGuestExportListModalProps {
  show?: boolean;
}

withDefaults(defineProps<IGuestExportListModalProps>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'export', format: ExportListFormat): void;
}>();

const formatInput = ref<ExportListFormat>('excel');
const isSubmiting = ref<boolean>(false);

const formatList = ref<SelectOption[]>([
  { id: 'excel', name: 'Excel' },
  { id: 'pdf', name: 'PDF' },
]);

const onSubmit = () => {
  isSubmiting.value = true;
  emit('export', formatInput.value);

  setTimeout(() => {
    isSubmiting.value = false;
  }, 200);
};
</script>
<template>
  <BaseModal
    title="Exportar lista de convidados"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn">
      <form @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          Selecione o formato que pretende baixar a lista de convidados
        </p>

        <BaseSelect
          id="formatExportGuest"
          v-model="formatInput"
          label="Formato: "
          :options="formatList"
          disable-empty
        />

        <div
          class="my-4 flex animate-fadeIn items-center justify-center space-x-3"
        >
          <BaseButton
            type="submit"
            btn-type="primary"
            class="my-1"
            size="md"
            :loading="isSubmiting"
            :disabled="isSubmiting"
            >Baixar agora</BaseButton
          >

          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="my-1"
            size="md"
            @click="$emit('closeModal')"
            >Cancelar</BaseButton
          >
        </div>
      </form>
    </div>
  </BaseModal>
</template>
