<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { useEventStore } from '@/stores/event';

const eventStore = useEventStore();

const selectedEventId = computed(() => eventStore.eventId ?? null);

// regra: no AdminHeader, normalmente queres ver partner staff
const includePartnerStaff = computed(() => true);

// regra: decide se queres mostrar admins aqui
// se quiseres, deixa true; se não, mete false
const includeAdmins = computed(() => true);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const { onlineUsers, refreshOnlineUsers, isRefreshing } =
  await useOnlineUsersWidget({
    eventId: selectedEventId,
    includePartnerStaff: includePartnerStaff.value,
    includeAdmins: includeAdmins.value,
    intervalMs: 30_000,
  });

const users = computed(() => onlineUsers.value ?? []);
const onlineCount = computed(() => users.value.length);

const eventUsers = computed(() => {
  const id = selectedEventId.value;
  if (!id) return [];
  return users.value.filter((u) => u.eventId === id);
});

const partnerStaffUsers = computed(() => {
  return users.value.filter((u) => u.partnerId != null);
});

const adminUsers = computed(() => {
  return users.value.filter(
    (u) =>
      u.roleName === 'Administrador' || u.roleName === 'Super Administrador',
  );
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
      class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
      @click="toggle"
    >
      <span class="opacity-80">Online:</span>
      <span class="font-semibold">{{ onlineCount }}</span>
      <span v-if="isRefreshing" class="ml-1 text-xs opacity-60">...</span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-[0.99]"
    >
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute right-0 top-10 z-50 max-h-[420px] w-[360px] overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-slate-800">
            Utilizadores online
          </div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
              @click="refreshUsers"
            >
              Actualizar
            </button>

            <button
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
              @click="close"
            >
              Fechar
            </button>
          </div>
        </div>

        <div v-if="selectedEventId" class="mt-3">
          <div class="mb-1 text-xs font-medium text-slate-500">
            Evento (noivos e equipa do evento)
          </div>

          <div
            v-if="eventUsers.length === 0"
            class="py-1 text-sm text-slate-500"
          >
            Ninguém online no evento.
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="u in eventUsers"
              :key="u.id"
              class="flex items-center gap-2"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-sm text-slate-800">{{ u.name }}</span>
              <span class="text-xs text-slate-500">({{ u.roleName }})</span>
            </li>
          </ul>
        </div>

        <div class="mt-4">
          <p class="mb-1 text-xs font-medium text-slate-500">Equipa</p>

          <div
            v-if="partnerStaffUsers.length === 0"
            class="py-1 text-sm text-slate-500"
          >
            Ninguém online na equipa.
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="u in partnerStaffUsers"
              :key="`p-${u.id}`"
              class="flex items-center gap-2"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-sm text-slate-800">{{ u.name }}</span>
              <span class="text-xs text-slate-500">({{ u.roleName }})</span>
            </li>
          </ul>
        </div>

        <div v-if="includeAdmins" class="mt-4">
          <div class="mb-1 text-xs font-medium text-slate-500">Admins</div>

          <div
            v-if="adminUsers.length === 0"
            class="py-1 text-sm text-slate-500"
          >
            Nenhum admin online.
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="u in adminUsers"
              :key="`a-${u.id}`"
              class="flex items-center gap-2"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-sm text-slate-800">{{ u.name }}</span>
              <span class="text-xs text-slate-500">({{ u.roleName }})</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>
