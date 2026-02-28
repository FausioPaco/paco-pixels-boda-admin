<script setup lang="ts">
const eventStore = useEventStore();
eventStore.loadFromCookies();

onMounted(() => {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
});
</script>

<template>
  <div>
    <LazyEventOverview
      v-if="eventStore.selected"
      :event-id="eventStore.selected.id"
    />

    <LazyEventDashboardStatsCards />
  </div>
</template>
