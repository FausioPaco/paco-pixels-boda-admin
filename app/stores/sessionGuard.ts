import { defineStore } from 'pinia';

export const useSessionGuardStore = defineStore('sessionGuard', () => {
  const showWarning = ref(false);
  const expiresAtMs = ref<number | null>(null);
  const warned = ref(false); // evita abrir o modal 2x

  const openWarning = (expMs: number) => {
    if (warned.value) return;
    expiresAtMs.value = expMs;
    showWarning.value = true;
    warned.value = true;
  };

  const closeWarning = () => {
    showWarning.value = false;
  };

  const reset = () => {
    showWarning.value = false;
    expiresAtMs.value = null;
    warned.value = false;
  };

  return { showWarning, expiresAtMs, openWarning, closeWarning, reset };
});
