<script setup lang="ts">
import draggable from 'vuedraggable';
import { getChecklistService } from '~/services/checklistService';

type SortableEvent = {
  item: HTMLElement;
  oldIndex?: number;
  newIndex?: number;
};

const eventStore = useEventStore();
const eventTypeName = computed(() => eventStore.eventTypeName);

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);

const { template, isRefreshing, refreshCurrentTemplate } =
  await useChecklistCurrentTemplate();

const isEditTemplateModalOpen = ref(false);

const isCreateSectionModalOpen = ref(false);

const refresh = async (opts?: { force?: boolean }) => {
  await refreshCurrentTemplate({ force: opts?.force ?? true });
};

const localSections = ref<ChecklistTemplateSection[]>([]);

watch(
  () => template.value?.sections,
  (list) => {
    const safe = list ?? [];
    localSections.value = [...safe].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  },
  { immediate: true },
);

const draggingId = ref<number | null>(null);

function onSectionDragStart(evt: SortableEvent) {
  const el = evt.item as HTMLElement;
  const id = Number(el?.dataset?.id);
  draggingId.value = Number.isFinite(id) ? id : null;
}

const onSectionsDragEnd = async () => {
  if (!template.value) return;

  const payload = localSections.value.map((s, idx) => ({
    id: s.id,
    order: idx + 1,
  }));

  await checklistService.reorderTemplateSections(template.value.id, payload);
  await refresh({ force: true });
};

const openCreateSection = () => {
  isCreateSectionModalOpen.value = true;
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col">
        <div class="text-lg">Template de checklist</div>
        <div class="text-sm opacity-70">
          {{ eventTypeName || 'Tipo de evento' }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <BaseButton
          label="Editar template"
          variant="secondary"
          :disabled="!template"
          @click="isEditTemplateModalOpen = true"
        />
        <BaseButton
          label="Actualizar"
          variant="secondary"
          :disabled="isRefreshing"
          @click="refresh({ force: true })"
        />
      </div>
    </div>

    <BaseLoading v-if="isRefreshing && !template" />

    <BaseSearchNotFound
      v-else-if="!template"
      message=" Não foi possível carregar o template para este tipo de evento."
    />

    <div v-else class="flex flex-col gap-4">
      <ChecklistTemplateHeaderCard :template="template" />

      <div class="flex items-center justify-between">
        <div class="text-base">Secções</div>
        <BaseButton label="Adicionar secção" @click="openCreateSection" />
      </div>

      <!-- DRAGGABLE SECTIONS -->
      <draggable
        v-model="localSections"
        item-key="id"
        handle=".drag-handle"
        class="flex flex-col gap-3"
        ghost-class="opacity-50"
        @start="onSectionDragStart"
        @end="onSectionsDragEnd"
      >
        <template #item="{ element: section }">
          <div :data-id="section.id" class="flex items-start gap-3 py-2">
            <button class="drag-handle cursor-grab pt-7">
              <IconGripvertical
                :font-controlled="false"
                class="size-5 transition-colors duration-200"
                :class="[
                  draggingId === section.id
                    ? 'text-primary-500 opacity-100'
                    : 'text-grey-500 hover:text-primary-500 opacity-60',
                ]"
              />
            </button>

            <ChecklistTemplateSection
              :template-id="template.id"
              :section="section"
              @changed="refresh({ force: true })"
            />
          </div>
        </template>
      </draggable>
    </div>

    <!-- Modificar nome do template -->
    <LazyChecklistTemplateFormModal
      v-model:open="isEditTemplateModalOpen"
      :template="template"
      @saved="refresh({ force: true })"
    />

    <!-- criar secção -->
    <LazyChecklistTemplateSectionFormModal
      v-model:open="isCreateSectionModalOpen"
      :template-id="template?.id ?? 0"
      :section="null"
      @saved="refresh({ force: true })"
    />
  </div>
</template>
