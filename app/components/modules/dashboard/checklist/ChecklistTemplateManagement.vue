<script setup lang="ts">
const eventStore = useEventStore();
const eventTypeName = computed(() => eventStore.eventTypeName);

const { template, isRefreshing, refreshCurrentTemplate } =
  await useChecklistCurrentTemplate();

const orderedSections = computed(() => {
  const list = template.value?.sections ?? [];
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

const isEditTemplateModalOpen = ref(false);

const refresh = async (opts?: { force?: boolean }) => {
  await refreshCurrentTemplate({ force: opts?.force ?? true });
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
        <!-- O botão “Adicionar secção” pode ficar aqui ou dentro do header card -->
        <BaseButton label="Adicionar secção" @click="$emit('addSection')" />
      </div>

      <div class="flex flex-col gap-3">
        <ChecklistTemplateSection
          v-for="section in orderedSections"
          :key="section.id"
          :template-id="template.id"
          :section="section"
          @changed="refresh({ force: true })"
        />
      </div>
    </div>

    <ChecklistTemplateFormModal
      v-model:open="isEditTemplateModalOpen"
      :template="template"
      @saved="refresh({ force: true })"
    />
  </div>
</template>
