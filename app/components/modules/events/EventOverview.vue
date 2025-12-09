<script setup lang="ts">
import { isMultiEventStaffUser } from '~~/shared/constants/roles';

defineOptions({
  name: 'EventOverview',
});

const props = defineProps<{
  eventId: number;
}>();

const { event, refreshEvent } = await useEvent(props.eventId);

const showFormModal = ref<boolean>(false);

// helpers
const eventName = computed(() => event.value?.name ?? '');
const eventTypeName = computed(() => event.value?.eventTypeName ?? '');
const initials = computed(() => event.value?.initials ?? '');
const eventDate = computed(() => event.value?.event_Date ?? undefined);

const formattedDate = computed(() => {
  if (!eventDate.value) return '--';
  return new Date(eventDate.value).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

const daysRemaining = computed(() => {
  if (!eventDate.value) return '--';
  const today = new Date();
  const target = new Date(eventDate.value);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// números básicos que temos já no BodaEvent
const guestsCount = computed(() => event.value?.guestsCount ?? 0);
const suppliersCount = computed(() => event.value?.suppliersCount ?? 0);

// placeholder por enquanto (ajustas quando tiveres no modelo)
const budgetDisplay = computed(() => '--');
const eventStore = useEventStore();
const authStore = useAuthStore();

const onFormSuccess = async () => {
  showFormModal.value = false;
  eventStore.selectEvent({
    id: event.value?.id ?? 0,
    name: event.value?.name ?? '',
    slug: event.value?.slug ?? '',
    icon: event.value?.eventTypeIcon ?? '',
    eventTypeId: event.value?.eventTypeId ?? undefined,
  });

  refreshEvent({ force: true });
};

onMounted(() => {
  refreshEvent({ force: true });
});
</script>

<template>
  <BaseCard title="Informações do evento">
    <template #right-content>
      <button
        v-if="event && isMultiEventStaffUser(authStore.user?.roleName)"
        type="button"
        class="text-primary-700 flex items-center gap-1 text-xs font-medium hover:underline"
        @click.prevent="showFormModal = true"
      >
        <span>Editar</span>
        <IconPencil
          :font-controlled="false"
          class="text-primary-700 h-3.5 w-3.5"
        />
      </button>
    </template>

    <div class="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <!-- Coluna esquerda: info do evento -->
      <dl class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-2">
        <!-- Nome do Evento -->
        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Nome do evento
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ eventName || '—' }}
          </dd>
        </div>

        <!-- Tipo de Evento -->
        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Tipo de evento
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ eventTypeName || '—' }}
          </dd>
        </div>

        <!-- Data do Evento -->
        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Data
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ formattedDate }}
          </dd>
        </div>

        <!-- Iniciais -->
        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Iniciais
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ initials || '—' }}
          </dd>
        </div>
      </dl>

      <!-- Coluna direita: cards de métricas -->
      <div class="grid gap-3 sm:grid-cols-2">
        <!-- Convidados -->
        <div class="bg-primary-50 rounded-2xl px-4 py-3">
          <div class="text-grey-700/60 mb-1 flex items-center gap-2 text-xs">
            <IconDashboardGuests
              :font-controlled="false"
              class="text-primary-700 size-[20px]"
            />
            <span>Convidados</span>
          </div>
          <p class="text-grey-900 text-sm font-semibold">
            {{ guestsCount }}
          </p>
        </div>

        <!-- Budget -->
        <div class="bg-primary-50 rounded-2xl px-4 py-3">
          <div class="text-grey-700/60 mb-1 flex items-center gap-2 text-xs">
            <IconDashboardBudget
              :font-controlled="false"
              class="text-primary-700 size-[20px]"
            />
            <span>Orçamento</span>
          </div>
          <p class="text-grey-900 text-sm font-semibold">
            {{ budgetDisplay }}
          </p>
        </div>

        <!-- Fornecedores -->
        <div class="bg-primary-50 rounded-2xl px-4 py-3">
          <div class="text-grey-700/60 mb-1 flex items-center gap-2 text-xs">
            <IconDashboardSuppliers
              :font-controlled="false"
              class="text-primary-700 size-[16px]"
            />
            <span>Fornecedores</span>
          </div>
          <p class="text-grey-900 text-sm font-semibold">
            {{ suppliersCount }}
          </p>
        </div>

        <!-- Dias restantes -->
        <div class="bg-primary-50 rounded-2xl px-4 py-3">
          <div class="text-grey-700/60 mb-1 flex items-center gap-2 text-xs">
            <IconCalendar
              :font-controlled="false"
              class="text-primary-700 size-[16px]"
            />
            <span>Dias restantes</span>
          </div>
          <p class="text-grey-900 text-sm font-semibold">
            {{ daysRemaining }}
          </p>
        </div>
      </div>
    </div>

    <LazyEventFormModal
      v-if="event"
      :show="showFormModal"
      :event="event"
      @close-modal="showFormModal = false"
      @success="onFormSuccess"
    />
  </BaseCard>
</template>
