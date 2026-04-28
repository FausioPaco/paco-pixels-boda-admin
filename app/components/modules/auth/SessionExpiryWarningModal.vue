<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toastification';

const { t } = useI18n();
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
    toast.success(t('auth.session_renewed'));
    sessionGuard.reset();
    return;
  }

  toast.info(t('auth.session_expired_info'));
  navigateTo('/?reason=session-expired');
};

const onLogout = async () => {
  await auth.logoutAsync();
  sessionGuard.reset();
  toast.info(t('auth.session_ended'));
  navigateTo('/?reason=session-expired');
};
</script>

<template>
  <BaseModal
    :title="t('auth.session_expiry_title')"
    size="small"
    :show="showWarning"
    @close-modal="sessionGuard.closeWarning"
  >
    <div class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        {{ t('auth.session_expiry_message', { time: formattedLeft }) }}
      </p>
    </div>

    <div class="flex w-full justify-center gap-3">
      <BaseButton btn-type="primary" size="md" @click="onStay">
        {{ t('auth.session_stay') }}
      </BaseButton>

      <BaseButton btn-type="outline-primary" size="md" @click="onLogout">
        {{ t('auth.session_logout') }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
