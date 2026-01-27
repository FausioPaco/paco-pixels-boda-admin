<script setup lang="ts">
type DeskLite = {
  id: number;
  name: string;
};

type Props = {
  show?: boolean;
  desks?: DeskLite[]; // lista de mesas disponíveis (não colocadas no mapa)
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  desks: () => [],
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'selectDesk', deskId: number): void;
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
        <BaseSearchNotFound v-if="filteredDesks.length === 0">
          Não há mesas disponíveis para adicionar.
        </BaseSearchNotFound>

        <div v-else class="max-h-[340px] overflow-auto">
          <button
            v-for="d in filteredDesks"
            :key="d.id"
            type="button"
            class="hover:bg-grey-50 w-full rounded-lg px-3 py-2 text-left text-sm transition"
            @click="emit('selectDesk', d.id)"
          >
            {{ d.name }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
