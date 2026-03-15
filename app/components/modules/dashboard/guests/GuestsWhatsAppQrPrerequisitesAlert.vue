<script setup lang="ts">
interface Props {
  isPartner?: boolean;
  blockingIssues?: string[];
  warnings?: string[];
  blockingTitle?: string;
  warningTitle?: string;
}

withDefaults(defineProps<Props>(), {
  isPartner: false,
  blockingIssues: () => [],
  warnings: () => [],
  blockingTitle:
    'Antes de enviar QR Codes por WhatsApp, complete a ficha complementar do evento.',
  warningTitle: 'Atenção',
});
</script>

<template>
  <div
    v-if="isPartner && blockingIssues.length"
    class="border-warning-200 bg-warning-50 rounded-2xl border p-4"
  >
    <p class="text-warning-700 text-sm font-semibold">
      {{ blockingTitle }}
    </p>

    <ul class="text-warning-700 mt-2 space-y-1 text-sm">
      <li v-for="issue in blockingIssues" :key="issue">• {{ issue }}</li>
    </ul>
  </div>

  <div
    v-else-if="isPartner && warnings.length"
    class="border-primary-200 bg-primary-50 rounded-2xl border p-4"
  >
    <p class="text-primary-700 text-sm font-semibold">
      {{ warningTitle }}
    </p>

    <ul class="text-primary-700 mt-2 space-y-1 text-sm">
      <li v-for="warning in warnings" :key="warning">• {{ warning }}</li>
    </ul>
  </div>
</template>
