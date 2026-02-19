<script setup lang="ts">
import { useToast } from 'vue-toastification';

const props = defineProps<{
  isInternal?: boolean;
}>();

const toast = useToast();
const { eventId } = useEventStore();

if (!eventId) {
  toast.error('O evento não foi encontrado.');
}

const isInternal = computed(() => props.isInternal ?? false);

const {
  program,
  isRefreshing,
  isPersisting,
  isError,
  errorMessage,
  refreshEventProgram,
  updateMode,
  reorderItems,
} = await useEventProgram(eventId!, {
  immediate: false,
  isInternal: isInternal.value,
});

onMounted(() => {
  refreshEventProgram();
});

// Tabs / Mode
const setMode = async (mode: 'manual' | 'upload') => {
  await updateMode(mode);
};

const showUploadModal = ref(false);
const showItemModal = ref(false);
const selectedItem = ref<EventProgramItem | undefined>(undefined);

const openCreateItemModal = () => {
  selectedItem.value = undefined;
  showItemModal.value = true;
};

const openEditItemModal = (item: EventProgramItem) => {
  selectedItem.value = item;
  showItemModal.value = true;
};

watch(errorMessage, (val) => {
  if (val) toast.error(val);
});
</script>

<template>
  <section class="relative flex w-full flex-col items-center px-4 py-5">
    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <div
        class="flex flex-col justify-start gap-3 md:flex-row md:items-center md:justify-between"
      >
        <!-- Tabs -->
        <div class="mt-4 md:w-[75%] lg:w-1/2">
          <BaseMiniSwitch
            :model-value="program?.mode ?? 'manual'"
            :items="[
              { value: 'manual', label: 'Criar lista', icon: 'document' },
              {
                value: 'upload',
                label: 'Carregar o seu programa',
                icon: 'upload',
              },
            ]"
            :disabled="isPersisting"
            size="sm"
            @update:model-value="setMode($event as any)"
          />
        </div>

        <!-- Refresh Program -->
        <div class="flex gap-2 md:w-1/2 md:justify-end">
          <BaseButton
            btn-type="outline-primary"
            btn-size="sm"
            :disabled="isRefreshing || isPersisting"
            icon="refresh"
            :icon-size="16"
            @click="refreshEventProgram"
          >
            Actualizar
          </BaseButton>

          <BaseButton
            v-if="program?.mode === 'manual'"
            btn-type="primary"
            btn-size="sm"
            icon="download"
            :icon-size="16"
            :disabled="isPersisting"
            @click="
              toast.info('Exportação para PDF será ligada no próximo passo.')
            "
          >
            Gerar PDF
          </BaseButton>
        </div>
      </div>

      <!-- Loading -->
      <BaseTableLoading v-if="isRefreshing" class="mt-6 hidden md:block" />
      <BaseLoading
        v-if="isRefreshing"
        size="lg"
        orientation="vertical"
        class="mt-6 block md:hidden"
      />

      <!-- Error -->
      <BaseError v-if="!isRefreshing && isError && errorMessage" class="mt-6">
        {{ errorMessage }}
      </BaseError>

      <!-- Content -->
      <div v-if="!isRefreshing && program" class="mt-6">
        <EventProgramUploadCard
          v-if="program.mode === 'upload'"
          :program="program"
          @upload="showUploadModal = true"
        />

        <EventProgramTimeline
          v-else
          :items="program.items"
          :is-persisting="isPersisting"
          @add="openCreateItemModal"
          @edit="openEditItemModal"
          @reorder="reorderItems"
        />
      </div>
    </div>

    <!-- Modals -->
    <LazyEventProgramUploadModal
      :show="showUploadModal"
      :is-internal="isInternal"
      @close-modal="showUploadModal = false"
      @success="
        showUploadModal = false;
        refreshEventProgram();
      "
    />

    <LazyEventProgramItemFormModal
      :show="showItemModal"
      :item="selectedItem"
      :is-internal="isInternal"
      @close-modal="
        showItemModal = false;
        selectedItem = undefined;
      "
      @success="
        showItemModal = false;
        selectedItem = undefined;
        refreshEventProgram();
      "
    />
  </section>
</template>
