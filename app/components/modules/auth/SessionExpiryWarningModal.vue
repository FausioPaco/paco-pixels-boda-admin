<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toastification';

const auth = useAuthStore();
const sessionGuard = useSessionGuardStore();
const { showWarning, expiresAtMs } = storeToRefs(sessionGuard);

const toast = useToast();

const secondsLeft = computed(() => {
  if (!expiresAtMs.value) return 0;
  return Math.max(0, Math.floor((expiresAtMs.value - Date.now()) / 1000));
});

const formattedLeft = computed(() => {
  const s = secondsLeft.value;
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
});

const onStay = async () => {
  const ok = await auth.tryRefresh();

  if (ok) {
    toast.success('Sessão renovada.');
    sessionGuard.reset();
    return;
  }

  toast.info('A sessão expirou.');
  navigateTo('/?reason=session-expired');
};

const onLogout = async () => {
  await auth.logoutAsync();
  sessionGuard.reset();
  toast.info('A sessão foi terminada.');
  navigateTo('/?reason=session-expired');
};
</script>

<template>
  <BaseModal
    title="Sessão prestes a expirar"
    size="small"
    :show="showWarning"
    @close-modal="sessionGuard.closeWarning"
  >
    <div class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        A sua sessão vai expirar em
        <b>{{ formattedLeft }}</b
        >.
        <br />
      </p>
    </div>

    <div class="flex w-full justify-center gap-3">
      <BaseButton btn-type="primary" size="md" @click="onStay">
        Continuar
      </BaseButton>

      <BaseButton btn-type="outline-primary" size="md" @click="onLogout">
        Terminar sessão
      </BaseButton>
    </div>
  </BaseModal>
</template>
