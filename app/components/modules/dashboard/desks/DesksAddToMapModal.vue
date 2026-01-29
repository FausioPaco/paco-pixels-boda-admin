<script setup lang="ts">
type DeskLite = {
  id: number;
  name: string;
};

type Props = {
  show?: boolean;
  desks?: DeskLite[]; // lista de mesas disponíveis (não colocadas no mapa)
  isAddingDesk?: boolean;
  loadingDeskId?: number | null;
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  isAddingDesk: false,
  loadingDeskId: null,
  desks: () => [],
});

const shape = ref<'round' | 'rect'>('round');

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'selectDesk', payload: { deskId: number; shape: 'round' | 'rect' }): void;
}>();

const deskSearch = ref('');

const filteredDesks = computed(() => {
  const q = deskSearch.value.trim().toLowerCase();
  if (!q) return props.desks;

  return props.desks.filter((d) => (d.name ?? '').toLowerCase().includes(q));
});

watch(
  () => props.show,
  (open) => {
    if (open) deskSearch.value = '';
  },
);
</script>

<template>
  <BaseModal
    title="Adicionar mesa ao mapa"
    :show="show"
    @close-modal="emit('closeModal')"
  >
    <div class="my-2 animate-fadeIn space-y-3">
      <BaseInput
        id="deskSearchMap"
        v-model="deskSearch"
        placeholder="Pesquisar mesa..."
      />

      <div class="rounded-lg border p-2">
        <!-- Shape da mesa -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border px-3 py-2 text-sm transition"
            :class="
              shape === 'round'
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'hover:bg-grey-50'
            "
            @click="shape = 'round'"
          >
            Redonda
          </button>

          <button
            type="button"
            class="rounded-lg border px-3 py-2 text-sm transition"
            :class="
              shape === 'rect'
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'hover:bg-grey-50'
            "
            @click="shape = 'rect'"
          >
            Rectangular
          </button>
        </div>

        <BaseSearchNotFound v-if="filteredDesks.length === 0">
          Não há mesas disponíveis para adicionar.
        </BaseSearchNotFound>

        <div v-else class="max-h-[340px] overflow-auto">
          <BaseLoading v-if="isAddingDesk" message="Adicionando mesa..." />
          <div v-else class="my-2 animate-fadeIn">
            <button
              v-for="d in filteredDesks"
              :key="d.id"
              type="button"
              class="hover:bg-grey-50 w-full rounded-lg px-3 py-2 text-left text-sm transition"
              :class="
                loadingDeskId === d.id ? 'bg-primary-700 text-white' : undefined
              "
              :disabled="isAddingDesk"
              @click="emit('selectDesk', { deskId: d.id, shape })"
            >
              {{ d.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
