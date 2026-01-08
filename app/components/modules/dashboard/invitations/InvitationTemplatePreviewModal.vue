<script setup lang="ts">
type Props = {
  show?: boolean;
  template?: InvitationTemplate | null;
  imageUrl?: string | null;
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  template: null,
  imageUrl: null,
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'useTemplate', templateId: number): void;
}>();
</script>

<template>
  <BaseModal
    :show="props.show"
    title="Pré-visualizar modelo"
    @close-modal="emit('closeModal')"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-grey-900 truncate text-base font-semibold">
            {{ props.template?.name ?? 'Modelo' }}
          </p>
          <p class="text-grey-500 text-xs">
            Pré-visualização do modelo seleccionado
          </p>
        </div>
      </div>

      <div class="bg-grey-50 overflow-hidden rounded-xl border">
        <img
          v-if="props.imageUrl"
          :src="props.imageUrl"
          class="block w-full"
          alt="Pré-visualização do template"
        />
        <div v-else class="text-grey-500 p-6 text-sm">
          Nenhuma imagem disponível para pré-visualização.
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton btn-type="outline-primary" @click="emit('closeModal')">
          Cancelar
        </BaseButton>

        <BaseButton
          v-if="props.template?.id"
          btn-type="primary"
          @click="emit('useTemplate', props.template.id)"
        >
          Usar este modelo
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
