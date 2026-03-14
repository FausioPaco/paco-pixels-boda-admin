<script setup lang="ts">
interface Props {
  show?: boolean;
  exportTotal?: number;
  exportProcessed?: number;
  exportPercent?: number;
  summary?: WhatsAppQrLogsSummary | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  exportTotal: 0,
  exportProcessed: 0,
  exportPercent: 0,
  summary: null,
});

const emit = defineEmits(['closeModal']);
const isFinished = computed(() => !!props.summary);
</script>

<template>
  <BaseModal
    :show="show"
    :title="isFinished ? 'Envio concluído' : 'A enviar QR Codes via WhatsApp'"
    @close-modal="emit('closeModal')"
  >
    <div class="space-y-3">
      <p class="text-grey-700 text-sm">
        Processados
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
        <p class="text-grey-700 mb-2 text-xs font-semibold">Resumo de envio</p>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <p class="text-grey-700">Pendentes</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.pending }}
          </p>

          <p class="text-grey-700">Aceites pela plataforma</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.accepted }}
          </p>

          <p class="text-grey-700">Entregues</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.delivered }}
          </p>

          <p class="text-grey-700">Visualizados</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.seen }}
          </p>

          <p class="text-grey-700">Ignorados (telefone inválido)</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.skippedInvalidPhone }}
          </p>

          <p class="text-grey-700">Ignorados (já entregue)</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.skippedAlreadyDelivered }}
          </p>

          <p class="text-grey-700">Falhas temporárias</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.failedTemporary }}
          </p>

          <p class="text-grey-700">Falhas permanentes</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.failedPermanent }}
          </p>

          <p class="text-grey-700">Entrega por confirmar</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.deliveryUnknown }}
          </p>

          <p class="text-grey-700">Precisa de verificação</p>
          <p class="text-grey-900 text-right font-semibold">
            {{ summary.needsReview }}
          </p>
        </div>
      </div>

      <p class="text-grey-500 text-xs">
        Os processados incluem mensagens aceites pela plataforma, falhas e
        convidados ignorados. A entrega final é confirmada posteriormente pelo
        nosso parceiro.
      </p>

      <div class="flex justify-end">
        <BaseButton
          btn-type="outline-primary"
          btn-size="sm"
          @click="emit('closeModal')"
        >
          {{ isFinished ? 'Fechar' : 'Continuar a usar o sistema' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
