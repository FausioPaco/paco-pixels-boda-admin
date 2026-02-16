<script setup lang="ts">
const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);

const selectedEvent = ref<BodaEvent | null>(null);
const eventToRemove = ref<BodaEvent | null>(null);

const queryParameters = reactive<EventParameters>({
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 40,
});

const { events, pagination, isRefreshing, isError, refreshEvents } =
  await useEventsList(queryParameters);

const searchQuery = ref('');

const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(queryParameters, () => {
  refreshEvents();
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    events.value.length === 0 &&
    searchQuery.value === '',
);

const onCreateEvent = () => {
  selectedEvent.value = null;
  showFormModal.value = true;
};

const onEventUpdate = (event: BodaEvent) => {
  selectedEvent.value = event;
  showFormModal.value = true;
};

const onEventRemove = (event: BodaEvent) => {
  eventToRemove.value = event;
  showRemoveModal.value = true;
};

const onFormSuccess = async () => {
  showFormModal.value = false;
  queryParameters.pageNumber = 1;
  queryParameters.searchQuery = '';

  refreshEvents({ force: true });
};

const onRemoveSuccess = async () => {
  showRemoveModal.value = false;
  refreshEvents({ force: true });
};

const eventStore = useEventStore();

onMounted(() => {
  eventStore.clearSelectedEvent();
  refreshEvents({ force: true });
});
</script>
<template>
  <div class="flex w-full animate-fadeIn flex-col gap-2">
    <!-- Content Title -->
    <div class="my-8 flex w-full flex-col items-center justify-center gap-2">
      <h1 class="text-2xl font-bold md:text-3xl">Selecione o evento</h1>
      <p
        class="text-grey-400 max-w-[550px] text-center text-base font-light md:text-lg"
      >
        Selecione um evento para aceder aos detalhes, convidados e progresso da
        preparação.
      </p>
    </div>

    <section
      id="events"
      class="relative flex w-full flex-col items-center px-4 py-5"
    >
      <div
        class="flex min-w-full flex-col items-stretch justify-stretch md:min-w-[45vw] md:max-w-[1400px] lg:min-w-[65vw] xl:min-w-[75vw]"
      >
        <!-- Filters & Counter -->
        <div
          v-if="!isRefreshing"
          class="flex w-full animate-fadeIn flex-col md:flex-row md:items-start md:justify-between"
        >
          <div class="w-full md:w-1/2">
            <BaseInput
              id="eventName"
              v-model="searchQuery"
              autocomplete="name"
              type="search"
              name="eventName"
              label="Pesquisa:"
              placeholder="Pesquise o nome do evento"
              :readonly="isRefreshing"
            />

            <!-- Counter & Limit -->
            <div v-if="!isRefreshing" class="flex items-center justify-between">
              <div class="my-4 flex items-center space-x-2">
                <icon-funnel
                  :font-controlled="false"
                  class="text-primary-700 block h-7 w-7"
                ></icon-funnel>
                <h3 class="text-primary-700 text-2xl font-bold">
                  {{
                    pagination?.totalCount === 1
                      ? '1 Evento'
                      : `${pagination ? pagination.totalCount : 0} Eventos`
                  }}
                </h3>
              </div>
            </div>
          </div>

          <div
            class="flex h-fit w-full flex-col justify-start gap-4 md:w-1/2 md:flex-row md:justify-end md:gap-2 md:pt-6"
          >
            <BaseButton
              icon="add"
              size="md"
              btn-type="primary"
              @click.prevent="onCreateEvent"
            >
              Criar Evento
            </BaseButton>
          </div>
        </div>

        <!-- Loading -->
        <BaseTableLoading v-if="isRefreshing" class="hidden md:block" />

        <BaseLoading
          v-if="isRefreshing"
          size="lg"
          orientation="vertical"
          class="block md:hidden"
        />

        <!-- SearchNotFound -->
        <BaseSearchNotFound
          v-if="!isFirstTime && events.length === 0"
          @fallback="refreshEvents"
        >
          Infelizmente, não encontramos mesas para o filtro aplicado
        </BaseSearchNotFound>

        <!-- No desk: first Time -->
        <LazyBaseFirstEmptyState
          v-if="isFirstTime"
          icon="icon-event-wedding"
          title="Ainda não criou evento"
          description="Crie o seu primeiro evento para começar a organizar os lugares dos seus convidados de forma mais eficiente."
          button-label="Criar primero evento"
          button-icon="add"
          show-button
          @action="onCreateEvent"
        />

        <!-- Data -->
        <div
          v-if="!isRefreshing && !isError && events.length > 0"
          class="my-4 flex flex-col flex-wrap gap-4 md:flex-row"
        >
          <EventItem
            v-for="event in events"
            :key="event.id"
            :event="event"
            @update="onEventUpdate"
            @remove="onEventRemove"
          />
        </div>

        <!-- Pagination -->
        <BasePagination
          v-if="pagination && pagination.totalPages > 1"
          :pagination-data="pagination"
          @page-change="onPageChange"
          @page-selected="onPageSelected"
        />
      </div>

      <LazyEventFormModal
        :show="showFormModal"
        :event="selectedEvent"
        @close-modal="showFormModal = false"
        @success="onFormSuccess"
      />

      <LazyEventRemoveModal
        :show="showRemoveModal"
        :event="eventToRemove"
        @close-modal="showRemoveModal = false"
        @success="onRemoveSuccess"
      />
    </section>
  </div>
</template>
