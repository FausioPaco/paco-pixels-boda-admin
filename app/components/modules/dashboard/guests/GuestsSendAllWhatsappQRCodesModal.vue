<script setup lang="ts">
import type { ExportTextColor } from '~~/shared/types/guest';

interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), { show: false });

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (
    e: 'send',
    payload: { color: ExportTextColor; force: boolean; reason?: string },
  ): void;
}>();

const colorInput = ref<ExportTextColor>('black');
const forceInput = ref(false);
const reasonInput = ref('');

const isSubmitting = ref(false);

const textColorList = ref<SelectOption[]>([
  { id: 'black', name: 'Preto' },
  { id: 'white', name: 'Branco' },
]);

const canSubmit = computed(() => {
  if (!forceInput.value) return true;
  return !!reasonInput.value?.trim();
});

const onSubmit = () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;

  emit('send', {
    color: colorInput.value,
    force: forceInput.value,
    reason: forceInput.value ? reasonInput.value.trim() : undefined,
  });

  setTimeout(() => {
    isSubmitting.value = false;
    resetForm();
  }, 200);
};

const resetForm = () => {
  colorInput.value = 'black';
  forceInput.value = false;
  reasonInput.value = '';
};

const closeModal = () => {
  resetForm();
  emit('closeModal');
};
</script>

<template>
  <BaseModal
    title="Enviar QR Codes via WhatsApp"
    :show="show"
    @close-modal="closeModal"
  >
    <div class="my-2 animate-fadeIn">
      <form class="space-y-3" @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          Esta acção vai enviar 1 imagem (QR Code) por convidado elegível.
        </p>

        <BaseSelect
          id="whatsAppQrTextColor"
          v-model="colorInput"
          label="Cor do texto:"
          :options="textColorList"
          disable-empty
        />

        <div class="bg-grey-50 rounded-lg p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-grey-800 text-sm font-semibold">Reenvio forçado</p>
              <p class="text-grey-500 text-xs">
                Use apenas em casos raros. Permite voltar a enviar mesmo quando
                já existe entrega confirmada ou histórico anterior relevante.
              </p>
            </div>

            <BaseToggle
              id="forceInput"
              v-model="forceInput"
              size="md"
              reverse
            />
          </div>

          <div v-if="forceInput" class="mt-3">
            <BaseInput
              id="reasonInput"
              v-model="reasonInput"
              label="Motivo do reenvio (obrigatório):"
              placeholder="Ex: o convidado pediu novo envio / houve erro anterior"
            />
          </div>
        </div>

        <p class="text-grey-500 text-xs">
          O envio inicial indica apenas que a plataforma aceitou a mensagem. A
          confirmação de entrega e visualização acontece depois, através dos
          reports do provider.
        </p>

        <div class="my-4 flex items-center justify-center space-x-3">
          <BaseButton
            type="submit"
            btn-type="primary"
            class="my-1"
            size="md"
            :loading="isSubmitting"
            :disabled="isSubmitting || !canSubmit"
          >
            Enviar agora
          </BaseButton>

          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="my-1"
            size="md"
            @click="closeModal"
          >
            Cancelar
          </BaseButton>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
