<script setup lang="ts">
interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'send'): void;
}>();

const isSubmitting = ref(false);

const onSubmit = () => {
  isSubmitting.value = true;

  emit('send');

  setTimeout(() => {
    isSubmitting.value = false;
  }, 200);
};
</script>

<template>
  <BaseModal
    title="Enviar convites via WhatsApp"
    :show="show"
    @close-modal="emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn">
      <form class="space-y-3" @submit.prevent="onSubmit">
        <p class="text-grey-400 text-left text-base md:text-lg">
          Esta acção vai enviar o convite por WhatsApp para todos os convidados
          elegíveis.
        </p>

        <p class="text-grey-500 text-xs">
          O envio inicial apenas confirma que a mensagem foi aceite pela
          plataforma. A entrega e visualização serão actualizadas
          posteriormente.
        </p>

        <div class="my-4 flex items-center justify-center gap-3">
          <BaseButton
            type="submit"
            btn-type="primary"
            class="my-1"
            size="md"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Enviar convites
          </BaseButton>

          <BaseButton
            type="button"
            btn-type="outline-primary"
            class="my-1"
            size="md"
            @click="emit('closeModal')"
          >
            Cancelar
          </BaseButton>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
