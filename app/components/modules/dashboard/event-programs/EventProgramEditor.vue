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
        class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex items-center gap-2">
          <h2 class="text-primary-700 text-2xl font-bold">
            {{ isInternal ? 'Programa interno' : 'Programa para convidados' }}
          </h2>
        </div>

        <div class="flex gap-2">
          <BaseButton
            btn-type="outline-primary"
            size="md"
            :disabled="isRefreshing || isPersisting"
            icon="refresh"
            @click="refreshEventProgram"
          >
            Actualizar
          </BaseButton>

          <BaseButton
            v-if="program?.mode === 'manual'"
            btn-type="primary"
            size="md"
            icon="download"
            :disabled="isPersisting"
            @click="
              toast.info('Exportação para PDF será ligada no próximo passo.')
            "
          >
            Gerar PDF
          </BaseButton>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mt-4 flex w-full flex-col gap-2 lg:flex-row">
        <BaseButton
          btn-type="primary"
          size="md"
          :disabled="isPersisting"
          :class="program?.mode === 'manual' ? '' : 'opacity-60'"
          @click="setMode('manual')"
        >
          Criar lista
        </BaseButton>

        <BaseButton
          btn-type="outline-primary"
          size="md"
          :disabled="isPersisting"
          :class="program?.mode === 'upload' ? '' : 'opacity-60'"
          @click="setMode('upload')"
        >
          Carregar o seu programa
        </BaseButton>
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
