<script setup lang="ts">
const eventStore = useEventStore();
eventStore.loadFromCookies();
</script>

<template>
  <div>
    <LazyEventOverview
      v-if="eventStore.selected"
      :event-id="eventStore.selected.id"
    />
  </div>
</template>
