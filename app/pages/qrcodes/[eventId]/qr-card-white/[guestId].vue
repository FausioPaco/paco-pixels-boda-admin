<script setup lang="ts">
const route = useRoute();
const eventId = Number(route.params.eventId);
const guestId = Number(route.params.guestId);

const {
  event,
  isRefreshing: isLoadingEvent,
  isError: isErrorEvent,
} = await useEvent(eventId);
const {
  guest,
  isRefreshing: isLoadingGuest,
  isError: isErrorGuest,
} = await useGuest(guestId);
</script>
<template>
  <div class="min-h-screen">
    <div v-if="isErrorEvent" class="text-white">
      Ocorreu um erro ao carregar o QR Code: Dados do evento.
    </div>
    <div v-else-if="isErrorGuest" class="text-white">
      Ocorreu um erro ao carregar o QR Code: Dados do convidado.
    </div>
    <div
      v-else-if="!isLoadingEvent && !isLoadingGuest && guest && event"
      id="qr-card"
    >
      <q-r-code-background-server-model
        :guest="guest"
        :boda-event="event"
        color="white"
      />
    </div>
  </div>
</template>
