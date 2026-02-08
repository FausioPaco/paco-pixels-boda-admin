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
const iconName = computed(() => eventStore.eventTypeIcon || 'event-wedding');

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);
const { siteConfig } = await useClientConfig();

const { template, isRefreshing, refreshCurrentTemplate } =
  await useChecklistCurrentTemplate(siteConfig.partnerId ?? null);

const isEditTemplateModalOpen = ref(false);

const isCreateSectionModalOpen = ref(false);

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
  await refreshCurrentTemplate({ force: true });
};

const openCreateSection = () => {
  isCreateSectionModalOpen.value = true;
};
</script>

<template>
  <div class="my-8 flex animate-fadeIn flex-col gap-4">
    <div class="flex flex-col gap-2">
      <!-- Event badge -->
      <span class="text-primary-700/40 font-semibold"
        >Modelo de cronograma</span
      >
      <div
        class="bg-primary-50 flex w-fit items-end gap-2 rounded-full px-4 py-2"
      >
        <component
          :is="`icon-${iconName}`"
          :font-controlled="false"
          class="text-primary-700 size-[20px]"
        />
        <span class="text-primary-700 font-bold">{{ eventTypeName }}</span>
      </div>

      <div class="my-4">
        <p class="text-grey-500 mb-3 text-sm">
          Aqui podes actualizar o modelo de cronograma para eventos do tipo
          <span class="text-primary-700 font-bold"> {{ eventTypeName }}</span>
        </p>
        <p class="text-grey-500 text-sm">
          As alterações feitas neste modelo serão
          <b>usadas como base nos próximos eventos</b> deste tipo, ajudando a
          manter o cronograma consistente e rápido de preparar.
        </p>
      </div>
    </div>

    <BaseLoading v-if="isRefreshing && !template" />

    <BaseSearchNotFound v-else-if="!template"
      >Não foi possível carregar o modelo para este tipo de
      evento.</BaseSearchNotFound
    >

    <div v-else class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="text-primary-700/50 text-base font-semibold">
          Secções deste modelo
        </div>
        <BaseButton @click="openCreateSection">Adicionar secção</BaseButton>
      </div>

      <!-- DRAGGABLE SECTIONS -->
      <draggable
        v-model="localSections"
        item-key="id"
        handle=".drag-handle"
        class="flex w-full flex-col gap-3"
        ghost-class="opacity-50"
        @start="onSectionDragStart"
        @end="onSectionsDragEnd"
      >
        <template #item="{ element: section }">
          <div :data-id="section.id" class="flex w-full items-start gap-3 py-2">
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
              @changed="refreshCurrentTemplate({ force: true })"
            />
          </div>
        </template>
      </draggable>
    </div>

    <!-- Modificar nome do template -->
    <LazyChecklistTemplateFormModal
      :show="isEditTemplateModalOpen"
      :template="template"
      @close="isCreateSectionModalOpen = false"
      @saved="refreshCurrentTemplate({ force: true })"
    />

    <!-- criar secção -->
    <LazyChecklistTemplateSectionFormModal
      :show="isCreateSectionModalOpen"
      :template-id="template?.id ?? 0"
      :section="null"
      @close="isCreateSectionModalOpen = false"
      @saved="refreshCurrentTemplate({ force: true })"
    />
  </div>
</template>
