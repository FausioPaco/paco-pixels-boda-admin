import { getUserService } from '~/services/userService';

// <script setup lang="ts">
// const { startHeartbeat, stopHeartbeat } = useUserHeartbeat();

// // quando o layout monta (user já autenticado)
// onMounted(() => {
//   startHeartbeat(60_000); // 1 minuto
// });

// // opcional: se tiveres logout aqui, podes chamar stopHeartbeat();
// </script>

export const useUserHeartbeat = () => {
  const nuxtApp = useNuxtApp();
  const userService = getUserService(nuxtApp.$api);
  const intervalId = ref<number | null>(null);

  const sendHeartbeat = async () => {
    try {
      await userService.heartbeat();
    } catch (error) {
      // Opcional: podes logar em dev / ignorar em produção
      console.error('Falha no heartbeat do utilizador', error);
    }
  };

  const startHeartbeat = (intervalMs = 60_000) => {
    if (!import.meta.client) return; // só no browser
    if (intervalId.value !== null) return; // já está a correr

    // Envia um logo à partida
    void sendHeartbeat();

    intervalId.value = window.setInterval(() => {
      void sendHeartbeat();
    }, intervalMs);
  };

  const stopHeartbeat = () => {
    if (!import.meta.client) return;
    if (intervalId.value !== null) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
  };

  onUnmounted(() => {
    stopHeartbeat();
  });

  return {
    startHeartbeat,
    stopHeartbeat,
  };
};
