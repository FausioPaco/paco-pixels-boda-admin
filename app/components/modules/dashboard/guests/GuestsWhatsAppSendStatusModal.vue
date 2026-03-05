<script setup lang="ts">
import type { WhatsAppQrLogsSummary } from '~~/shared/types/whatsappQr';

interface Props {
  show?: boolean;
  exportTotal?: number;
  exportProcessed?: number;
  exportPercent?: number;
  summary?: WhatsAppQrLogsSummary | null;
}

withDefaults(defineProps<Props>(), {
  show: false,
  exportTotal: 0,
  exportProcessed: 0,
  exportPercent: 0,
  summary: null,
});

const emit = defineEmits(['closeModal']);
</script>

<template>
  <BaseModal
    :show="show"
    title="A enviar QR Codes via WhatsApp"
    @close-modal="emit('closeModal')"
  >
    <div class="space-y-3">
      <p class="text-grey-700 text-sm">
        A processar
        <b class="text-success-500">{{ exportProcessed }}</b> de
        {{ exportTotal }}
        <span class="text-grey-400 font-semibold">({{ exportPercent }}%)</span>
      </p>

      <div class="bg-grey-50 h-2 w-full overflow-hidden rounded-full">
        <div
          class="bg-success-500 h-2"
          :style="{ width: `${exportPercent}%` }"
        ></div>
      </div>

      <div v-if="summary" class="bg-grey-50 rounded-lg p-3">
        <p class="text-grey-700 mb-2 text-xs font-semibold">Resumo</p>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <p class="text-grey-700">Enviados</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.sent }}
          </p>

          <p class="text-grey-700">Ignorados (telefone inválido)</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.skippedInvalidPhone }}
          </p>

          <p class="text-grey-700">Ignorados (já enviado)</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.skippedAlreadySent }}
          </p>

          <p class="text-grey-700">Falhas (temporárias)</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.failedTemporary }}
          </p>

          <p class="text-grey-700">Falhas (permanentes)</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.failedPermanent }}
          </p>
        </div>

        <p v-if="summary.uiNote" class="text-grey-500 mt-3 text-xs">
          {{ summary.uiNote }}
        </p>
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
