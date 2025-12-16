<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { useEventStore } from '@/stores/event';

const eventStore = useEventStore();

const selectedEventId = computed(() => eventStore.eventId ?? null);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const { siteConfig } = await useClientConfig();

const { onlineUsers, refreshOnlineUsers, isRefreshing } =
  await useOnlineUsersWidget({
    eventId: selectedEventId,
    includePartnerStaff: true,
    includeAdmins: true,
  });

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    refreshOnlineUsers();
  }, 30_000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const users = computed(() => onlineUsers.value ?? []);
const onlineCount = computed(() => users.value.length);

const eventUsers = computed(() => {
  const id = selectedEventId.value;
  if (!id) return [];
  return users.value.filter((u) => u.eventId === id);
});

const partnerStaffUsers = computed(() => {
  return users.value.filter((u) => u.partnerId != null && u.eventId === null);
});

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

onClickOutside(dropdownRef, () => {
  if (!isOpen.value) return;
  close();
});

const refreshUsers = () => {
  refreshOnlineUsers();
};
</script>
<template>
  <div class="relative hidden md:block">
    <button
      type="button"
      class="hover:bg-primary-100 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors ease-in"
      @click.prevent="toggle"
    >
      <span
        class="block size-[8px] rounded-full"
        :class="onlineCount === 0 ? 'bg-gray-400' : 'bg-success-600'"
      ></span>
      <span class="opacity-80">Online:</span>
      <span class="font-semibold">
        {{ onlineCount }}
      </span>
      <span v-if="isRefreshing" class="ml-1 text-xs opacity-60">...</span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 trangray-y-1 scale-[0.99]"
      enter-to-class="opacity-100 trangray-y-0 scale-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100 trangray-y-0 scale-100"
      leave-to-class="opacity-0 trangray-y-1 scale-[0.99]"
    >
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute right-0 top-10 z-50 max-h-[420px] w-[360px] overflow-auto rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <div
            class="flex items-center gap-2 text-sm font-semibold text-gray-800"
          >
            <span>Utilizadores online</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
              @click="refreshUsers"
            >
              Actualizar
            </button>

            <button
              class="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
              @click="close"
            >
              Fechar
            </button>
          </div>
        </div>

        <div v-if="selectedEventId" class="mt-3">
          <div class="mb-1 text-xs font-medium text-gray-400">
            Equipa do evento
          </div>

          <div
            v-if="eventUsers.length === 0"
            class="py-1 text-sm text-gray-500"
          >
            Ninguém online do evento.
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="u in eventUsers"
              :key="u.id"
              class="flex items-center gap-2"
            >
              <span class="bg-success-600 h-2 w-2 rounded-full"></span>
              <span class="text-sm text-gray-800">{{ u.name }}</span>
              <span class="text-xs text-gray-400">({{ u.roleName }})</span>
            </li>
          </ul>
        </div>

        <div class="mt-4">
          <p class="mb-1 text-xs font-medium text-gray-400">
            Equipa da {{ siteConfig.entity }}
          </p>

          <div
            v-if="partnerStaffUsers.length === 0"
            class="py-1 text-sm text-gray-500"
          >
            Ninguém online na equipa.
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="u in partnerStaffUsers"
              :key="`p-${u.id}`"
              class="flex items-center gap-2"
            >
              <span class="bg-success-600 h-2 w-2 rounded-full"></span>
              <span class="text-sm text-gray-800">{{ u.name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>
