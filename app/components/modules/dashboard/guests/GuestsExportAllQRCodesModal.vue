<script setup lang="ts">
import type { ExportTextColor } from '~~/shared/types/guest';

interface IGuestInvitationModalProps {
  show?: boolean;
}

withDefaults(defineProps<IGuestInvitationModalProps>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'export', format: ExportQROptions): void;
}>();

const formatInput = ref<ExportFormat>('png');
const colorInput = ref<ExportTextColor>('black');

const isSubmiting = ref<boolean>(false);
const formatList = ref<SelectOption[]>([
  //{ id: 'pdf', name: 'Formato PDF' },
  { id: 'png', name: 'Formato de Imagem (PNG)' },
]);

const textColorList = ref<SelectOption[]>([
  { id: 'black', name: 'Preto' },
  { id: 'white', name: 'Branco' },
]);

const onSubmit = () => {
  isSubmiting.value = true;
  emit('export', {
    color: colorInput.value,
    format: formatInput.value,
  });

  setTimeout(() => {
    isSubmiting.value = false;
  }, 200);
};
</script>
<template>
  <BaseModal
    title="Exportar todos QRCodes"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn">
      <form @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          Selecione o formato que pretende baixar todos QRCodes
        </p>

        <BaseSelect
          id="formatQRCodeExport"
          v-model="formatInput"
          label="Formato: "
          :options="formatList"
          disable-empty
        />

        <BaseSelect
          id="formatQRCodeExport"
          v-model="colorInput"
          label="Cor do texto: "
          :options="textColorList"
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
