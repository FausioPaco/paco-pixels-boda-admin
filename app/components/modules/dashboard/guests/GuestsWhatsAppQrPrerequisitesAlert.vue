<script setup lang="ts">
interface Props {
  isPartner?: boolean;
  blockingIssues?: string[];
  warnings?: string[];
}

withDefaults(defineProps<Props>(), {
  isPartner: false,
  blockingIssues: () => [],
  warnings: () => [],
});

const { t } = useI18n();
</script>

<template>
  <div
    v-if="isPartner && blockingIssues.length"
    class="rounded-2xl border border-warning-100 bg-warning-50 p-4"
  >
    <p class="text-sm font-semibold text-warning-800">
      {{ t('guests.wa_prereq_blocking_title') }}
    </p>

    <ul class="mt-2 space-y-1 text-sm text-warning-800">
      <li v-for="issue in blockingIssues" :key="issue">{{ issue }}</li>
    </ul>

    <BaseButtonLink
      :to="`/admin#overview`"
      btn-size="sm"
      btn-type="outline-primary"
      class="my-2"
    >
      {{ t('guests.wa_prereq_fill_now') }}
    </BaseButtonLink>
  </div>

  <div
    v-else-if="isPartner && warnings.length"
    class="rounded-2xl border border-primary-200 bg-primary-50 p-4"
  >
    <p class="text-sm font-semibold text-primary-700">
      {{ t('guests.wa_prereq_warning_title') }}
    </p>

    <ul class="mt-2 space-y-1 text-sm text-primary-700">
      <li v-for="warning in warnings" :key="warning">• {{ warning }}</li>
    </ul>
  </div>
</template>
