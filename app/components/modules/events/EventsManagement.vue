<script setup lang="ts">
type DatePeriodOption =
  | 'all'
  | 'thisYear'
  | 'lastYear'
  | 'last6Months'
  | 'last3Months'
  | 'custom';

const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);

const selectedEvent = ref<BodaEvent | null>(null);
const eventToRemove = ref<BodaEvent | null>(null);
const period = ref<DatePeriodOption>('thisYear');
const customRange = ref<[Date | null, Date | null]>([null, null]);

const periodOptions = [
  { id: 'all', name: 'Todos' },
  { id: 'thisYear', name: 'Este ano' },
  { id: 'last6Months', name: 'Últimos 6 meses' },
  { id: 'last3Months', name: 'Últimos 3 meses' },
  { id: 'lastYear', name: 'Ano passado' },
  { id: 'custom', name: 'Customizado' },
];

const queryParameters = reactive<EventParameters>({
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 40,
});

const { events, pagination, isRefreshing, isError, refreshEvents } =
  await useEventsList(queryParameters);

watch(
  queryParameters,
  () => {
    refreshEvents();
  },
  { deep: true },
);

const searchQuery = ref('');

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

function getEventMainDate(e: BodaEvent) {
  const raw = e.event_Date ?? e.created_At;
  return raw ? new Date(raw as Date) : null;
}

// agrupamento + ordenação
const groupedEventsByMonth = computed(() => {
  const list = [...events.value];

  list.sort((a, b) => {
    const da = getEventMainDate(a)?.getTime() ?? 0;
    const db = getEventMainDate(b)?.getTime() ?? 0;
    return da - db;
  });

  const map = new Map<
    string,
    { key: string; label: string; dateRef: Date; items: BodaEvent[] }
  >();

  for (const e of list) {
    const d = getEventMainDate(e);

    if (!d) {
      if (!map.has('no-date')) {
        map.set('no-date', {
          key: 'no-date',
          label: 'Sem data',
          dateRef: new Date(0),
          items: [],
        });
      }

      map.get('no-date')!.items.push(e);
      continue;
    }

    const key = getMonthKey(d);

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: getMonthYearLabel(d),
        dateRef: new Date(d.getFullYear(), d.getMonth(), 1),
        items: [],
      });
    }

    map.get(key)!.items.push(e);
  }

  return Array.from(map.values()).sort(
    (a, b) => a.dateRef.getTime() - b.dateRef.getTime(),
  );
});

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function setApiDateRange(start: Date | null, end: Date | null) {
  Object.assign(queryParameters, {
    startDate: start ? formatDDMMYYYY(start) : '',
    endDate: end ? formatDDMMYYYY(end) : '',
    pageNumber: 1,
  });
}

function applyPeriodFilter() {
  const now = new Date();

  switch (period.value) {
    case 'all':
      setApiDateRange(null, null);
      return;

    case 'thisYear': {
      const y = now.getFullYear();
      setApiDateRange(new Date(y, 0, 1), new Date(y, 11, 31));
      return;
    }

    case 'last6Months': {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate(),
      );
      setApiDateRange(startOfDay(start), endOfDay(now));
      return;
    }

    case 'last3Months': {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        now.getDate(),
      );
      setApiDateRange(startOfDay(start), endOfDay(now));
      return;
    }

    case 'lastYear': {
      const y = now.getFullYear() - 1;
      setApiDateRange(new Date(y, 0, 1), new Date(y, 11, 31));
      return;
    }

    case 'custom': {
      const [start, end] = customRange.value ?? [null, null];
      if (start && end) setApiDateRange(startOfDay(start), endOfDay(end));
      else setApiDateRange(null, null);
      return;
    }
  }
}

const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(period, () => {
  if (period.value === 'all') {
    customRange.value = [null, null];
    setApiDateRange(null, null);
    return;
  }

  if (period.value !== 'custom') {
    customRange.value = [null, null];
    applyPeriodFilter();
    return;
  }

  // custom
  const [start, end] = customRange.value ?? [null, null];
  if (!start || !end) {
    const now = new Date();
    const defaultEnd = endOfDay(now);
    const defaultStart = startOfDay(addDays(now, -7));
    customRange.value = [defaultStart, defaultEnd];
    return;
  }

  applyPeriodFilter();
});

watch(
  customRange,
  () => {
    if (period.value === 'custom') applyPeriodFilter();
  },
  { deep: true },
);

onMounted(() => {
  applyPeriodFilter();
  refreshEvents({ force: true });
  eventStore.clearSelectedEvent();
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

    <ClientOnly>
      <section
        id="events"
        class="relative flex w-full max-w-full flex-col items-center px-4 py-5 md:px-10"
      >
        <div class="flex min-w-full flex-col items-stretch justify-stretch">
          <!-- Filters & Counter -->
          <div
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

              <BaseSelect
                id="eventsPeriod"
                v-model="period"
                label="Período"
                :options="periodOptions"
                :readonly="isRefreshing"
                disable-empty
              />

              <div v-if="period === 'custom'">
                <label class="mb-1 block text-sm font-medium"
                  >Intervalo de datas</label
                >

                <DatePicker
                  v-model="customRange"
                  locale="pt-PT"
                  :enable-time-picker="false"
                  :clearable="true"
                  :teleport="true"
                  :format="'dd/MM/yyyy'"
                  :auto-apply="true"
                  :disabled="isRefreshing"
                  range
                  placeholder="Selecione início e fim"
                  select-text="Selecionar"
                  cancel-text="Cancelar"
                />
              </div>

              <!-- Counter & Limit -->
              <div
                v-if="!isRefreshing"
                class="flex items-center justify-between"
              >
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
          <div v-if="isRefreshing" class="my-6">
            <BaseLoading size="lg" orientation="vertical" />
          </div>

          <!-- SearchNotFound -->
          <BaseSearchNotFound
            v-if="
              !isFirstTime && events.length === 0 && !isRefreshing && !isError
            "
            @fallback="refreshEvents({ force: true })"
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
            class="my-6 flex w-full animate-fadeIn flex-col gap-6"
          >
            <section
              v-for="group in groupedEventsByMonth"
              :key="group.key"
              class="w-full"
            >
              <!-- Month Header -->
              <div
                class="sticky top-0 z-10 -mx-2 mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/60 px-4 py-3 shadow-sm backdrop-blur md:mx-0 dark:bg-slate-900/60"
              >
                <div class="flex items-center gap-3">
                  <IconCalendar
                    :font-controlled="false"
                    class="text-primary-700 block h-7 w-7"
                  />
                  <h3 class="text-base font-semibold capitalize md:text-lg">
                    {{ group.label }}
                  </h3>
                </div>

                <div
                  class="bg-grey-50 text-grey-700 dark:text-primary-200 rounded-full px-3 py-1 text-sm font-medium dark:bg-slate-800"
                >
                  {{ group.items.length }}
                  {{ group.items.length === 1 ? 'evento' : 'eventos' }}
                </div>
              </div>

              <!-- Events Grid -->
              <div class="flex flex-col gap-4 md:flex-row md:flex-wrap">
                <EventItem
                  v-for="event in group.items"
                  :key="event.id"
                  :event="event"
                  @update="onEventUpdate"
                  @remove="onEventRemove"
                />
              </div>
            </section>
          </div>

          <!-- Pagination -->
          <LazyBasePagination
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
      <template #fallback>
        <div
          class="my-6 flex w-full animate-fadeIn items-center justify-center"
        >
          <BaseLoading size="lg" orientation="vertical" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
