<script setup lang="ts">
defineProps<{
  items: EventProgramItem[];
  isPersisting: boolean;
}>();

const emit = defineEmits(['add', 'edit', 'remove', 'reorder']);

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

    <ol v-else class="relative mt-6 space-y-6">
      <li v-for="(it, index) in items" :key="it.id" class="relative">
        <div class="flex flex-wrap gap-2 pl-4">
          <!-- Coluna do ícone (fixa) -->
          <div class="w-20 shrink-0">
            <div class="relative flex justify-center">
              <!-- Linha vertical (só se não for último) -->
              <div
                v-if="items.length > 1 && index !== items.length - 1"
                class="bg-primary-200 absolute left-1/2 top-14 hidden w-px -translate-x-1/2 md:block"
                style="height: calc(100% + 1.5rem)"
              ></div>

              <div
                class="border-primary-200 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white shadow-sm"
              >
                <component
                  :is="`icon-${it.iconKey}`"
                  :font-controlled="false"
                  class="text-primary-700 h-7 w-7"
                />
              </div>

              <!-- Controlos de ordem (ícones) -->
              <div
                v-if="items.length > 1"
                class="absolute -left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-1 md:flex"
              >
                <button
                  type="button"
                  class="border-primary-200 text-primary-700 hover:bg-primary-50 flex h-7 w-7 items-center justify-center rounded-lg border bg-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="isPersisting || index === 0"
                  aria-label="Subir"
                  title="Subir"
                  @click="move(items, it.id, -1)"
                >
                  <IconChevronUp :font-controlled="false" class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  class="border-primary-200 text-primary-700 hover:bg-primary-50 flex h-7 w-7 items-center justify-center rounded-lg border bg-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="isPersisting || index === items.length - 1"
                  aria-label="Descer"
                  title="Descer"
                  @click="move(items, it.id, 1)"
                >
                  <IconChevronDown :font-controlled="false" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Card -->
          <div
            class="border-primary-100 flex-1 rounded-2xl border bg-white px-6 py-5 shadow-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <!-- Time + título (mesma linha como no PDF) -->
                <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <div class="text-primary-700 text-xl font-bold">
                    {{ it.time }}
                  </div>
                  <div class="truncate text-xl font-semibold text-gray-900">
                    {{ it.title }}
                  </div>
                </div>

                <div v-if="it.description" class="mt-2 text-base text-gray-500">
                  {{ it.description }}
                </div>
              </div>

              <!-- Acções no canto superior direito -->
              <div
                class="mt-4 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row sm:items-center sm:gap-2"
              >
                <div
                  class="flex flex-col flex-wrap gap-2 sm:items-center md:flex-row"
                >
                  <BaseButton
                    btn-type="outline-primary"
                    btn-size="sm"
                    icon="pencil"
                    :icon-size="12"
                    class="w-full sm:w-auto"
                    :disabled="isPersisting"
                    @click="$emit('edit', it)"
                  >
                    Editar
                  </BaseButton>

                  <BaseButton
                    btn-type="outline-primary"
                    btn-size="sm"
                    icon="trash"
                    :icon-size="12"
                    class="w-full sm:w-auto"
                    :disabled="isPersisting"
                    @click="$emit('remove', it)"
                  >
                    Remover
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
