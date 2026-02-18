<script setup lang="ts">
defineProps<{
  items: EventProgramItem[];
  isPersisting: boolean;
}>();

const emit = defineEmits(['add', 'edit', 'reorder']);

const move = async (
  items: EventProgramItem[],
  itemId: number,
  direction: -1 | 1,
) => {
  const ids = items.map((x) => x.id);
  const idx = ids.indexOf(itemId);
  const nextIdx = idx + direction;

  if (idx < 0) return;
  if (nextIdx < 0 || nextIdx >= ids.length) return;

  const reordered = [...ids];
  const [picked] = reordered.splice(idx, 1);
  reordered.splice(nextIdx, 0, picked!);

  emit('reorder', reordered);
};
</script>

<template>
  <div class="w-full rounded-2xl border bg-white p-5">
    <div
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h3 class="text-primary-700 text-xl font-bold">
          Editor de Programa de Evento
        </h3>
        <p class="text-sm text-gray-600">Adicione items ao seu cronograma.</p>
      </div>

      <BaseButton
        icon="add"
        size="md"
        btn-type="primary"
        :disabled="isPersisting"
        @click.prevent="$emit('add')"
      >
        Adicionar novo item
      </BaseButton>
    </div>

    <div v-if="items.length === 0" class="mt-6">
      <LazyBaseFirstEmptyState
        icon="icon-dashboard-program"
        title="Ainda não criou nenhum item"
        description="Crie o seu primeiro item para começar a montar o programa do evento."
        :show-button="true"
        button-label="Criar primeiro item"
        button-icon="add"
        @action="$emit('add')"
      />
    </div>

    <ol v-else class="mt-6 space-y-3">
      <li
        v-for="it in items"
        :key="it.id"
        class="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="flex gap-4">
          <div class="text-primary-700 min-w-[64px] text-lg font-bold">
            {{ it.time }}
          </div>

          <div class="space-y-1">
            <div class="text-primary-700 font-semibold">{{ it.title }}</div>
            <div v-if="it.description" class="text-sm text-gray-600">
              {{ it.description }}
            </div>

            <div class="text-xs text-gray-500">icon_key: {{ it.iconKey }}</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="edit"
            :disabled="isPersisting"
            @click="$emit('edit', it)"
          >
            Editar
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="arrow-up"
            :disabled="isPersisting"
            @click="move(items, it.id, -1)"
          >
            Subir
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            icon="arrow-down"
            :disabled="isPersisting"
            @click="move(items, it.id, 1)"
          >
            Descer
          </BaseButton>
        </div>
      </li>
    </ol>
  </div>
</template>
