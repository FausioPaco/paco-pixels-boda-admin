<script setup lang="ts">
import { getGuestService } from '~/services/guestService'; // ajusta o caminho se for diferente

type DeskGuestLite = {
  id: number;
  name: string;
  people_Count?: number | null;
  seatNumber?: number | null;
};

type Props = {
  show?: boolean;
  eventId: number;

  deskId: number | null;
  deskName: string | null;

  seatNumber: number | null;
  currentGuestName?: string | null;

  // ✅ lista já filtrada por mesa (vem do snapshot)
  deskGuests?: DeskGuestLite[];
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  deskGuests: () => [],
  currentGuestName: null,
});

const emit = defineEmits<{
  (e: 'close-modal' | 'assigned'): void;
}>();

const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const query = ref('');
const selectedGuestId = ref<number | null>(null);
const isSaving = ref(false);
const errorMsg = ref<string | null>(null);

watch(
  () => props.show,
  (open) => {
    if (!open) return;
    query.value = '';
    selectedGuestId.value = null;
    errorMsg.value = null;
  },
);

// ⚡ UX: sugerir primeiro os convidados “sem lugar”
const orderedDeskGuests = computed(() => {
  const list = props.deskGuests ?? [];
  const noSeat = list.filter((g) => !g.seatNumber || g.seatNumber <= 0);
  const withSeat = list.filter((g) => g.seatNumber && g.seatNumber > 0);
  return [...noSeat, ...withSeat];
});

const filteredGuests = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return orderedDeskGuests.value;

  return orderedDeskGuests.value.filter((g) =>
    (g.name ?? '').toLowerCase().includes(q),
  );
});

const selectedGuest = computed(() => {
  const id = selectedGuestId.value;
  if (!id) return null;
  return (props.deskGuests ?? []).find((g) => g.id === id) ?? null;
});

function onSearchGuests(text: string) {
  query.value = text;
  selectedGuestId.value = null;
}

function onSelectGuest(item: DeskGuestLite) {
  // aqui sim tens o ID real
  selectedGuestId.value = Number(item.id);
}

function close() {
  emit('close-modal');
}

async function assign() {
  errorMsg.value = null;

  if (!props.deskId || !props.seatNumber) return;

  if (!selectedGuestId.value) {
    errorMsg.value = 'Selecciona um convidado.';
    return;
  }

  try {
    isSaving.value = true;

    await guestService.assignSeat(Number(selectedGuestId.value), {
      deskId: props.deskId,
      seatNumber: props.seatNumber,
    });

    emit('assigned');
    close();
  } catch (err) {
    console.error(err);

    if (isFetchErrorLike(err)) {
      errorMsg.value = getServerErrors(err.data);
    } else {
      errorMsg.value = 'Ocorreu um erro ao registar o movimento';
    }
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <BaseModal title="Atribuir lugar" :show="show" @close-modal="close">
    <div class="my-2 animate-fadeIn space-y-4">
      <!-- Contexto -->
      <div class="rounded-xl border bg-white p-3">
        <div class="text-grey-300 text-sm">
          Mesa:
          <span class="text-primary-800 font-semibold">
            {{ deskName ?? '-' }}
          </span>
          <span class="text-grey-300 mx-3">•</span>
          Lugar:
          <span class="text-primary-800 font-semibold">
            {{ seatNumber ?? '-' }}
          </span>
        </div>

        <div class="text-grey-400 my-2 text-xs">
          Estamos a mostrar apenas convidados desta mesa para evitar enganos.
        </div>

        <div
          v-if="currentGuestName"
          class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          Este lugar está ocupado por
          <span class="font-semibold">{{ currentGuestName }}</span
          >. Se atribuíres outro convidado, vais substituir.
        </div>
      </div>

      <!-- Auto-complete (desk only) -->
      <div class="space-y-2">
        <BaseAutoCompleteInput
          id="guestSeatAuto"
          v-model="query"
          :items="filteredGuests"
          item-label="name"
          item-key="id"
          placeholder="Pesquisar convidado desta mesa..."
          :disabled="!deskId"
          :min-chars="0"
          @search="onSearchGuests"
          @select="onSelectGuest"
        />

        <div v-if="selectedGuest" class="text-grey-400 text-xs">
          Grupo: {{ selectedGuest.people_Count ?? 1 }} pessoa(s)
          <span v-if="selectedGuest.seatNumber">
            • já tinha lugar: {{ selectedGuest.seatNumber }}
          </span>
        </div>
      </div>

      <BaseAlert v-if="errorMsg" type="error" :message="errorMsg" show />

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2">
        <BaseButton btn-type="outline-primary" @click="close">
          Cancelar
        </BaseButton>

        <BaseButton
          :loading="isSaving"
          :disabled="!selectedGuestId || !deskId || !seatNumber"
          @click="assign"
        >
          Atribuir
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
