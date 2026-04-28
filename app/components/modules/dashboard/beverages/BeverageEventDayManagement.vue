<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getBeverageService } from '~/services/beverageService';

const props = defineProps<{
  eventId: number;
  moduleStatus: EventBeverageStatus;
}>();

const toast = useToast();
const { t } = useI18n();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isEventDayMode = computed(() => props.moduleStatus === 'EventDay');
const isClosed = computed(() => props.moduleStatus === 'Closed');

const queryParameters = reactive<EventBeveragesParameters>({
  eventId: props.eventId,
  categoryId: null,
  stockStatus: '',
  searchQuery: '',
  pageNumber: 1,
  pageSize: 20,
});

const { beverages, pagination, isRefreshing, isError, refreshEventBeverages } =
  await useEventBeveragesList(queryParameters);

const { refreshStockMovements } = await useBeverageStockMovements();

const searchQuery = ref('');
const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(queryParameters, () => {
  refreshEventBeverages({ force: true });
});

onMounted(() => {
  refreshEventBeverages({ force: true });
});

// Quick actions
const isUpdating = ref<Record<number, boolean>>({});

const applyOut = async (bev: EventBeverage, quantity: number) => {
  try {
    if (!ensureEventDayMode()) return;

    isUpdating.value[bev.id] = true;

    const result = await beverageService.addStockMovement(
      props.eventId,
      bev.id,
      {
        type: BeverageStockMovementType.Out,
        quantity,
        note: t('beverages.quick_consumption_note', { quantity }),
      },
    );

    // actualizar localmente (evitar refresh total)
    if (!beverages.value) return;

    beverages.value = beverages.value.map((x) =>
      x.id === bev.id
        ? { ...x, currentUnits: result.currentUnits, status: result.status }
        : x,
    );
    toast.success(t('beverages.toast_consumption_success'));
    refreshStockMovements({ force: true });
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_consumption_error'));
  } finally {
    isUpdating.value[bev.id] = false;
  }
};

const markOutOfStock = async (bev: EventBeverage) => {
  try {
    if (!ensureEventDayMode()) return;

    isUpdating.value[bev.id] = true;

    const result = await beverageService.addStockMovement(
      props.eventId,
      bev.id,
      {
        type: BeverageStockMovementType.MarkOutOfStock,
        quantity: 0,
        note: t('beverages.marked_out_of_stock_note'),
      },
    );

    if (!beverages.value) return;

    beverages.value = beverages.value.map((x) =>
      x.id === bev.id
        ? { ...x, currentUnits: result.currentUnits, status: result.status }
        : x,
    );
    refreshStockMovements({ force: true });
    toast.success(t('beverages.toast_out_of_stock_success'));
  } catch (e) {
    console.error(e);
    toast.error(t('beverages.toast_out_of_stock_error'));
  } finally {
    isUpdating.value[bev.id] = false;
  }
};

// Modais
const showManualModal = ref(false);
const showRestockModal = ref(false);
const showRestockListModal = ref(false);
const showEventDayAlert = ref(!isEventDayMode.value);

const selectedBeverage = ref<EventBeverage | null>(null);

const openManual = (bev: EventBeverage) => {
  if (!ensureEventDayMode()) return;

  selectedBeverage.value = bev;
  showManualModal.value = true;
};

const restockCandidates = computed(() => {
  const list = beverages.value ?? [];
  return list.filter((x) => x.status === 'Low' || x.status === 'OutOfStock');
});

const restockCount = computed(() => restockCandidates.value.length);

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const canRegisterMovements = computed(
  () => isEventDayMode.value && !isClosed.value,
);

const ensureEventDayMode = () => {
  if (!canRegisterMovements.value) {
    toast.info(t('beverages.toast_enable_event_day_mode'));
    return false;
  }
  return true;
};

const isFirstTime = computed(
  () =>
    !isRefreshing.value &&
    !isError.value &&
    (beverages.value?.length ?? 0) === 0 &&
    searchQuery.value === '' &&
    !queryParameters.categoryId &&
    !queryParameters.stockStatus,
);
</script>

<template>
  <section
    class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
  >
    <p class="text-grey-400 my-4 font-medium">
      {{ t('beverages.event_day_description') }}
    </p>

    <BaseAlert
      :show="showEventDayAlert"
      :title="t('beverages.alert_planning_mode_title')"
      :message="t('beverages.alert_planning_mode_message')"
      type="informative"
      @close="showEventDayAlert = !showEventDayAlert"
    />

    <div
      class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
    >
      <!-- Toolbar -->
      <div
        class="mb-6 mt-3 flex w-full animate-fadeIn flex-col gap-3 lg:flex-row lg:justify-between"
      >
        <div class="w-full lg:w-1/2">
          <BaseInput
            id="beverageSearchEventDay"
            v-model="searchQuery"
            autocomplete="off"
            type="search"
            name="beverageSearchEventDay"
            :label="t('beverages.search_label')"
            :placeholder="t('beverages.search_placeholder')"
            :readonly="isRefreshing"
            :disabled="!canRegisterMovements"
            disable-margins
          />
        </div>

        <div
          class="flex w-full flex-col justify-start gap-4 lg:w-1/2 lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:pt-5"
        >
          <BaseButton
            btn-type="outline-primary"
            btn-size="md"
            icon="list"
            :disabled="restockCount === 0 || !canRegisterMovements"
            @click="showRestockListModal = true"
          >
            {{ t('beverages.button_restock_list', { count: restockCount }) }}
          </BaseButton>

          <BaseButton
            size="md"
            btn-type="primary"
            :disabled="!canRegisterMovements || beverages.length === 0"
            @click.prevent="showRestockModal = true"
          >
            {{ t('beverages.button_restock') }}
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

      <!-- No beverages for the first time -->
      <BaseFirstEmptyState
        v-if="isFirstTime"
        icon="icon-beverage-event"
        :title="t('beverages.empty_title')"
        :description="t('beverages.empty_description')"
        :show-button="false"
        :button-label="t('beverages.empty_button')"
        button-icon="add"
      />

      <!-- Cards -->
      <div
        v-if="!isRefreshing && !isError"
        class="mt-5 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <BaseCard
          v-for="bev in beverages"
          :key="bev.id"
          :title="bev.name"
          :description="bev.beverageCategoryName ?? ''"
        >
          <div class="flex items-center justify-between">
            <BaseBadge
              :type="
                bev.status === 'OK'
                  ? 'success'
                  : bev.status === 'Low'
                    ? 'warning'
                    : 'error'
              "
              :text="
                bev.status === 'OK'
                  ? t('beverages.status_ok')
                  : bev.status === 'Low'
                    ? t('beverages.status_low')
                    : t('beverages.status_out_of_stock')
              "
            />

            <p class="text-grey-500 text-sm">
              {{ t('beverages.current_stock_label') }}
              <span class="text-grey-800 font-bold">{{
                bev.currentUnits ?? 0
              }}</span>
            </p>
          </div>

          <div
            v-if="bev.status !== 'OutOfStock'"
            class="mt-6 grid grid-cols-3 gap-2"
          >
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id] || !canRegisterMovements"
              @click="applyOut(bev, 1)"
            >
              -1
            </BaseButton>
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id] || !canRegisterMovements"
              @click="applyOut(bev, 6)"
            >
              -6
            </BaseButton>
            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id] || !canRegisterMovements"
              @click="applyOut(bev, 12)"
            >
              -12
            </BaseButton>
          </div>

          <div class="mt-4 flex flex-col gap-2 pb-5 md:flex-row">
            <BaseButton
              v-if="bev.status !== 'OutOfStock'"
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id] || !canRegisterMovements"
              @click="markOutOfStock(bev)"
            >
              {{ t('beverages.button_mark_out_of_stock') }}
            </BaseButton>

            <BaseButton
              btn-type="outline-primary"
              btn-size="sm"
              :disabled="!!isUpdating[bev.id] || !canRegisterMovements"
              @click="openManual(bev)"
            >
              {{ t('beverages.button_manual_movement') }}
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="pagination && pagination.totalPages > 1"
        :pagination-data="pagination"
        @page-change="onPageChange"
        @page-selected="onPageSelected"
      />

      <!-- Activity feed -->
      <BeverageStockMovements :event-id="eventId" />
    </div>

    <!-- Modals -->
    <LazyBeverageManualMovementModal
      :show="showManualModal"
      :event-id="props.eventId"
      :beverage="selectedBeverage"
      @close-modal="showManualModal = false"
      @success="
        showManualModal = false;
        refreshEventBeverages({ force: true });
        refreshStockMovements({ force: true });
      "
    />

    <LazyBeverageRestockModal
      :show="showRestockModal"
      :event-id="props.eventId"
      :candidates="restockCandidates"
      @close-modal="showRestockModal = false"
      @success="
        showRestockModal = false;
        refreshEventBeverages({ force: true });
        refreshStockMovements({ force: true });
      "
    />

    <LazyBeverageRestockListModal
      :show="showRestockListModal"
      :candidates="restockCandidates"
      @close-modal="showRestockListModal = false"
    />
  </section>
</template>
