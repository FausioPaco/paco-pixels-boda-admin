<script setup lang="ts">
interface Props {
  show?: boolean;
  exportTotal?: number | undefined;
  exportProcessed?: number | undefined;
  exportPercent?: number | undefined;
}

withDefaults(defineProps<Props>(), {
  show: false,
  exportTotal: undefined,
  exportProcessed: undefined,
  exportPercent: undefined,
});

const emit = defineEmits(['closeModal', 'success']);
</script>
<template>
  <BaseModal
    :show="show"
    title="A exportar QR Codes"
    @close-modal="emit('closeModal')"
  >
    <div class="space-y-3">
      <p class="text-grey-700 text-sm">
        A processar <b class="text-success-500">{{ exportProcessed }}</b> de
        {{ exportTotal }}
        <span class="text-grey-400 font-semibold">({{ exportPercent }}%)</span>
      </p>

      <div class="bg-grey-50 h-2 w-full overflow-hidden rounded-full">
        <div
          class="bg-success-500 h-2"
          :style="{ width: `${exportPercent}%` }"
        ></div>
      </div>

      <p class="text-grey-500 text-xs">
        Pode demorar alguns minutos em eventos com muitos convidados.
      </p>

      <div class="flex justify-end">
        <BaseButton
          btn-type="outline-primary"
          btn-size="sm"
          @click="emit('closeModal')"
        >
          Continuar a usar o sistema
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
