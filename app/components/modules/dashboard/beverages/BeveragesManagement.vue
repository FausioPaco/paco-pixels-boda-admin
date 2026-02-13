<script setup lang="ts">
import BeveragePlanningManagement from './BeveragePlanningManagement.vue';
import BeverageEventDayManagement from './BeverageEventDayManagement.vue';
import BeverageEstimatesManagement from './BeverageEstimatesManagement.vue';
import { getBeverageService } from '~/services/beverageService';
import { useToast } from 'vue-toastification';

type BeverageTab = 'ESTIMATES' | 'PLANNING' | 'EVENT_DAY';

const activeTab = ref<BeverageTab>('ESTIMATES');
const { eventId } = useEventStore();

const moduleStatus = ref<EventBeverageStatus>('Planning');
const isLoadingMode = ref(false);

const toast = useToast();
const nuxtApp = useNuxtApp();
const beverageService = getBeverageService(nuxtApp.$api);

const isEventDayMode = computed(() => moduleStatus.value === 'EventDay');
const isClosed = computed(() => moduleStatus.value === 'Closed');

async function loadMode() {
  try {
    const res = await beverageService.getBeverageModuleStatus(eventId!);
    moduleStatus.value = res.status;
  } catch (e) {
    console.error(e);
    moduleStatus.value = 'Planning';
  }
}

async function onToggleMode(next: boolean) {
  // next === true -> EventDay
  // next === false -> Planning
  try {
    isLoadingMode.value = true;

    if (next) {
      const res = await beverageService.enableEventDayMode(eventId!);
      moduleStatus.value = 'EventDay';
      toast.success(res.message);
    } else {
      const res = await beverageService.enableEventPlanningMode(eventId!);
      moduleStatus.value = 'Planning';
      toast.success(res.message);
    }
  } catch (e: unknown) {
    console.error(e);
    await loadMode();

    toast.error('Não foi possível alterar o modo do módulo de bebidas.');
  } finally {
    isLoadingMode.value = false;
  }
}

onMounted(async () => {
  await loadMode();
});
</script>

<template>
  <BaseCard
    title="Gestão de bebidas"
    description="Registe as bebidas, controle o stock e faça a gestão do consumo no dia do evento."
  >
    <template #right-content>
      <div class="flex w-full items-center gap-4">
        <div class="flex min-w-fit flex-col gap-2 text-right">
          <small class="text-grey-400 text-xs leading-tight">Modo</small>
          <p
            class="text-primary-700 mb-0 w-full text-base font-semibold leading-tight"
          >
            {{ isEventDayMode ? 'Dia do evento' : 'Planeamento' }}
          </p>
        </div>

        <BaseToggle
          id="beverageModuleMode"
          :model-value="isEventDayMode"
          :disabled="isClosed || isLoadingMode"
          :loading="isLoadingMode"
          size="md"
          reverse
          @change="onToggleMode"
        />
      </div>
    </template>

    <BaseTab>
      <BaseTabItem
        id="beverages-estimates"
        icon="planning"
        :tab-position="1"
        :total-tabs="3"
        :is-active="activeTab === 'ESTIMATES'"
        class="w-full md:w-1/3"
        @click="activeTab = 'ESTIMATES'"
      >
        Estimativas
      </BaseTabItem>

      <BaseTabItem
        id="beverages-planning"
        icon="beverage-stock"
        :tab-position="2"
        :total-tabs="3"
        :is-active="activeTab === 'PLANNING'"
        class="w-full md:w-1/3"
        @click="activeTab = 'PLANNING'"
      >
        Registo e inventário
      </BaseTabItem>

      <BaseTabItem
        id="beverages-event"
        icon="beverage-event"
        :tab-position="3"
        :total-tabs="3"
        :is-active="activeTab === 'EVENT_DAY'"
        class="w-full md:w-1/3"
        @click="activeTab = 'EVENT_DAY'"
      >
        Dia do evento
      </BaseTabItem>
    </BaseTab>

    <transition name="fade" mode="out-in">
      <component
        :is="
          activeTab === 'ESTIMATES'
            ? BeverageEstimatesManagement
            : activeTab === 'PLANNING'
              ? BeveragePlanningManagement
              : BeverageEventDayManagement
        "
        :event-id="eventId"
        :module-status="moduleStatus"
      />
    </transition>
  </BaseCard>
</template>
