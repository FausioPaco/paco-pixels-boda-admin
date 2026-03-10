<script setup lang="ts">
interface Props {
  show?: boolean;
  loading?: boolean;
  statusLabel?: string | null;
}

withDefaults(defineProps<Props>(), {
  show: false,
  loading: false,
  statusLabel: null,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'confirm'): void;
}>();
</script>

<template>
  <BaseModal
    :show="show"
    title="Reenviar convite por WhatsApp?"
    @close-modal="emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn space-y-4">
      <p class="text-grey-700 text-left text-base md:text-lg">
        Este convidado já possui histórico de envio por WhatsApp.
      </p>

      <p
        v-if="statusLabel"
        class="text-grey-500 text-left text-sm md:text-base"
      >
        Estado actual: <b>{{ statusLabel }}</b>
      </p>

      <p class="text-grey-500 text-left text-sm md:text-base">
        Reenvios podem gerar custos adicionais com o serviço de WhatsApp.
        Reenvie apenas quando houver um motivo claro, como pedido do convidado
        ou falha anterior confirmada.
      </p>

      <div class="my-4 flex animate-fadeIn items-center justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="primary"
          class="my-1"
          size="md"
          :loading="loading"
          :disabled="loading"
          @click="emit('confirm')"
        >
          Reenviar convite
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-1"
          size="md"
          :disabled="loading"
          @click="emit('closeModal')"
        >
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
