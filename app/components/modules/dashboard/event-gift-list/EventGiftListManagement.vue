<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <BaseCard
    :title="t('event_gift_list.card_title')"
    :description="t('event_gift_list.card_description')"
  >
    <EventGiftListEditor />
  </BaseCard>
</template>
