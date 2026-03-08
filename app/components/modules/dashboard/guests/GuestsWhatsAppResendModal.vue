<script setup lang="ts">
interface Props {
  show?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: false,
  loading: false,
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
        Este convite já foi enviado anteriormente para este convidado.
      </p>

      <p class="text-grey-500 text-left text-sm md:text-base">
        Os reenvios são permitidos, mas envios repetidos podem gerar custos
        adicionais com o serviço de WhatsApp. Reenvie apenas se for realmente
        necessário.
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
