<script setup lang="ts">
const eventId = useEventStore().ensureSelected();
const { desks } = await useDeskOptions();
</script>

<template>
  <LazyDesksSeatingPlanEditor :event-id="eventId" :desks="desks" />
</template>
