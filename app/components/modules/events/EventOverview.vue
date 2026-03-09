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
const showDetailsFormModal = ref<boolean>(false);

const eventStore = useEventStore();
const authStore = useAuthStore();

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

const guestsCount = computed(() => event.value?.guestsCount ?? 0);
const suppliersCount = computed(() => event.value?.suppliersCount ?? 0);

const budgetDisplay = computed(() =>
  event?.value?.budgetTotal
    ? formatMoney(event?.value.budgetTotal, event?.value.budgetCurrency)
    : '—',
);

const formatFallback = (value?: string | number | null) => {
  if (value === 0) return '0';
  if (value === null || value === undefined) return 'Não definido';

  const stringValue = String(value).trim();
  return stringValue ? stringValue : 'Não definido';
};

const formatTime = (value?: string | null) => {
  if (!value) return 'Não definido';
  return String(value).slice(0, 5);
};

const formatBirthDateWithAge = (value?: Date | string | null) => {
  if (!value) return 'Não definido';

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return 'Não definido';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  const formatted = birthDate.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return age >= 0 ? `${age} anos • ${formatted}` : formatted;
};

const eventContextItems = computed(() => [
  {
    label: 'Local',
    value: formatFallback(event.value?.location),
  },
  {
    label: 'Padrinhos',
    value: formatFallback(event.value?.godparentsCount),
  },
  {
    label: 'Tipo de decoração',
    value: formatFallback(event.value?.decorationType),
  },
  {
    label: 'Término previsto',
    value: formatTime(event.value?.event_End_Time),
  },
]);

const preferencesItems = computed(() => [
  {
    label: 'Restrições dietéticas',
    value: formatFallback(event.value?.dietaryRestrictions),
  },
  {
    label: 'Perfil dos convidados',
    value: formatFallback(event.value?.guestProfile),
  },
  {
    label: 'Paleta de cores',
    value: formatFallback(event.value?.colorPalette),
  },
]);

const brideItems = computed(() => [
  {
    label: 'Nacionalidade',
    value: formatFallback(event.value?.brideNationality),
  },
  {
    label: 'Idade e nascimento',
    value: formatBirthDateWithAge(event.value?.brideBirthDate),
  },
  {
    label: 'Profissão',
    value: formatFallback(event.value?.brideProfession),
  },
  {
    label: 'Documento',
    value: formatFallback(event.value?.brideDocument),
  },
]);

const groomItems = computed(() => [
  {
    label: 'Nacionalidade',
    value: formatFallback(event.value?.groomNationality),
  },
  {
    label: 'Idade e nascimento',
    value: formatBirthDateWithAge(event.value?.groomBirthDate),
  },
  {
    label: 'Profissão',
    value: formatFallback(event.value?.groomProfession),
  },
  {
    label: 'Documento',
    value: formatFallback(event.value?.groomDocument),
  },
]);

const hasAdministrativeDetails = computed(() =>
  [
    event.value?.location,
    event.value?.godparentsCount,
    event.value?.decorationType,
    event.value?.dietaryRestrictions,
    event.value?.guestProfile,
    event.value?.colorPalette,
    event.value?.event_End_Time,
    event.value?.brideNationality,
    event.value?.groomNationality,
    event.value?.brideBirthDate,
    event.value?.groomBirthDate,
    event.value?.brideProfession,
    event.value?.groomProfession,
    event.value?.brideDocument,
    event.value?.groomDocument,
  ].some((value) => value !== null && value !== undefined && value !== ''),
);

const onFormSuccess = async () => {
  showFormModal.value = false;
  eventStore.selectEvent({
    id: event.value?.id ?? 0,
    name: event.value?.name ?? '',
    slug: event.value?.slug ?? '',
    icon: event.value?.eventTypeIcon ?? '',
    eventTypeId: event.value?.eventTypeId ?? undefined,
  });

  await refreshEvent({ force: true });
};

const onDetailsFormSuccess = async () => {
  showDetailsFormModal.value = false;
  await refreshEvent({ force: true });
};

onMounted(() => {
  refreshEvent({ force: true });
});
</script>

<template>
  <BaseCard title="Informações do evento">
    <template #right-content>
      <div
        v-if="event && isMultiEventStaffUser(authStore.user?.roleName)"
        class="flex items-center gap-2"
      >
        <button
          type="button"
          class="text-primary-700 flex items-center gap-1 text-xs font-medium hover:underline"
          @click.prevent="showFormModal = true"
        >
          <span>Editar informação básica</span>
          <IconPencil
            :font-controlled="false"
            class="text-primary-700 h-3.5 w-3.5"
          />
        </button>
      </div>
    </template>

    <div class="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <dl class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-2">
        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Nome do evento
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ eventName || '—' }}
          </dd>
        </div>

        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Tipo de evento
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ eventTypeName || '—' }}
          </dd>
        </div>

        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Data
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ formattedDate }}
          </dd>
        </div>

        <div class="flex flex-col gap-1">
          <dt class="text-grey-300 text-xs font-medium uppercase tracking-wide">
            Iniciais
          </dt>
          <dd class="text-grey-900 text-base font-semibold">
            {{ initials || '—' }}
          </dd>
        </div>
      </dl>

      <div class="grid gap-3 sm:grid-cols-2">
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

    <div class="border-grey-100/30 mt-6 border-t pt-6">
      <div
        class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-wrap items-center gap-2">
          <IconDocument
            :font-controlled="false"
            class="text-primary-700 size-[32px]"
          />

          <div>
            <p class="text-grey-900 text-sm font-semibold">
              Ficha complementar do evento
            </p>
            <p class="text-grey-300 mt-1 text-xs">
              Informação organizada para consulta rápida pela equipa e
              parceiros.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-start gap-1 md:items-end">
          <div
            v-if="!hasAdministrativeDetails"
            class="bg-primary-50/50 text-primary-800/50 inline-flex rounded-full px-3 py-1 text-xs font-medium"
          >
            Ainda sem detalhes adicionais preenchidos
          </div>
          <button
            type="button"
            class="text-primary-700 flex items-center gap-1 text-xs font-medium hover:underline"
            @click.prevent="showDetailsFormModal = true"
          >
            <span>Editar Detalhes</span>
            <IconPencil
              :font-controlled="false"
              class="text-primary-700 h-3.5 w-3.5"
            />
          </button>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <!-- Sobre o evento -->
        <section
          class="border-primary-100 bg-primary-50/30 rounded-2xl border p-4"
        >
          <div class="mb-4 flex items-center gap-2">
            <IconInformation
              :font-controlled="false"
              class="text-primary-800/80 size-[16px]"
            />
            <h3 class="text-primary-800/80 text-sm font-semibold">
              Sobre evento
            </h3>
          </div>

          <dl class="space-y-3">
            <div
              v-for="item in eventContextItems"
              :key="item.label"
              class="border-primary-700/20 rounded-xl border bg-transparent px-3 py-2.5"
            >
              <dt
                class="text-grey-300 mb-1 text-[11px] font-medium uppercase tracking-wide"
              >
                {{ item.label }}
              </dt>
              <dd class="text-grey-900 text-sm font-medium leading-relaxed">
                {{ item.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Preferências -->
        <section
          class="border-primary-100 bg-primary-50/30 rounded-2xl border p-4"
        >
          <div class="mb-4 flex items-center gap-2">
            <IconLike
              :font-controlled="false"
              class="text-primary-800/80 size-[16px]"
            />
            <h3 class="text-primary-800/80 text-sm font-semibold">
              Preferências e perfil
            </h3>
          </div>

          <dl class="space-y-3">
            <div
              v-for="item in preferencesItems"
              :key="item.label"
              class="border-primary-700/20 rounded-xl border bg-transparent px-3 py-2.5"
            >
              <dt
                class="text-grey-300 mb-1 text-[11px] font-medium uppercase tracking-wide"
              >
                {{ item.label }}
              </dt>
              <dd class="text-grey-900 text-sm font-medium leading-relaxed">
                {{ item.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Noiva -->
        <section
          class="border-primary-100 bg-primary-50/30 rounded-2xl border p-4"
        >
          <div class="mb-4 flex items-center gap-2">
            <IconBudgetOutfit
              :font-controlled="false"
              class="text-primary-800/80 size-[16px]"
            />
            <h3 class="text-primary-800/80 text-sm font-semibold">
              Sobre a Noiva
            </h3>
          </div>

          <dl class="space-y-3">
            <div
              v-for="item in brideItems"
              :key="`bride-${item.label}`"
              class="border-primary-700/20 rounded-xl border bg-transparent px-3 py-2.5"
            >
              <dt
                class="text-grey-300 mb-1 text-[11px] font-medium uppercase tracking-wide"
              >
                {{ item.label }}
              </dt>
              <dd class="text-grey-900 text-sm font-medium leading-relaxed">
                {{ item.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Noivo -->
        <section
          class="border-primary-100 bg-primary-50/30 rounded-2xl border p-4"
        >
          <div class="mb-4 flex items-center gap-2">
            <IconSuit
              :font-controlled="false"
              class="text-primary-800/80 size-[16px]"
            />
            <h3 class="text-primary-800/80 text-sm font-semibold">
              Sobre o Noivo
            </h3>
          </div>

          <dl class="space-y-3">
            <div
              v-for="item in groomItems"
              :key="`groom-${item.label}`"
              class="border-primary-700/20 rounded-xl border bg-transparent px-3 py-2.5"
            >
              <dt
                class="text-grey-300 mb-1 text-[11px] font-medium uppercase tracking-wide"
              >
                {{ item.label }}
              </dt>
              <dd class="text-grey-900 text-sm font-medium leading-relaxed">
                {{ item.value }}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <LazyEventFormModal
      v-if="event"
      :show="showFormModal"
      :event="event"
      @close-modal="showFormModal = false"
      @success="onFormSuccess"
    />

    <LazyEventDetailsFormModal
      v-if="event"
      :show="showDetailsFormModal"
      :event="event"
      @close-modal="showDetailsFormModal = false"
      @success="onDetailsFormSuccess"
    />
  </BaseCard>
</template>
