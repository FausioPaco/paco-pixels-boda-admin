<script setup lang="ts">
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

defineOptions({ name: 'StatsCardHealth' });

const props = defineProps<{ stats: EventDashboardStats | null }>();

/** -----------------------------
 * Helpers
 * ------------------------------ */
const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));
const roundPct = (v: number) => clamp(Math.round(v));
const safeDiv = (a: number, b: number) => (b ? a / b : 0);

const score = computed(() =>
  clamp(Math.round(props.stats?.overview?.healthScore ?? 0)),
);

const guestsTotal = computed(() => props.stats?.guests?.total ?? 0);
const guestsPending = computed(() => props.stats?.guests?.pending ?? 0);

const unassignedGuests = computed(
  () => props.stats?.seating?.unassignedGuests ?? 0,
);

const suppliersTotal = computed(() => props.stats?.suppliers?.total ?? 0);
const suppliersPending = computed(() => props.stats?.suppliers?.pending ?? 0);

const tasksTotal = computed(() => props.stats?.checklist?.total ?? 0);
const tasksOverdue = computed(() => props.stats?.checklist?.overdue ?? 0);

const budgetActual = computed(() =>
  Number(props.stats?.budget?.totalActual ?? 0),
);
const budgetUnpaid = computed(() =>
  Number(props.stats?.budget?.totalUnpaid ?? 0),
);

/** -----------------------------
 * Backend weights (por pontos)
 * 100 - penalizações
 * ------------------------------ */
const weights = {
  rsvpPending: 25,
  seatingUnassigned: 25,
  suppliersPending: 20,
  tasksOverdue: 20,
  budgetUnpaid: 10,
} as const;

/** Rates (0-100) */
const pendingRatePct = computed(() =>
  roundPct(safeDiv(guestsPending.value, guestsTotal.value) * 100),
);

const unassignedRatePct = computed(() =>
  roundPct(safeDiv(unassignedGuests.value, guestsTotal.value) * 100),
);

const suppliersPendingRatePct = computed(() =>
  roundPct(safeDiv(suppliersPending.value, suppliersTotal.value) * 100),
);

const overdueRatePct = computed(() =>
  roundPct(safeDiv(tasksOverdue.value, tasksTotal.value) * 100),
);

const unpaidRatePct = computed(() =>
  roundPct(safeDiv(budgetUnpaid.value, budgetActual.value) * 100),
);

/** Penalizações (em pontos) */
const penaltyPoints = computed(() => {
  const p1 =
    safeDiv(guestsPending.value, guestsTotal.value) * weights.rsvpPending;
  const p2 =
    safeDiv(unassignedGuests.value, guestsTotal.value) *
    weights.seatingUnassigned;
  const p3 =
    safeDiv(suppliersPending.value, suppliersTotal.value) *
    weights.suppliersPending;
  const p4 =
    safeDiv(tasksOverdue.value, tasksTotal.value) * weights.tasksOverdue;
  const p5 =
    safeDiv(budgetUnpaid.value, budgetActual.value) * weights.budgetUnpaid;

  return {
    rsvpPending: clamp(Math.round(p1), 0, weights.rsvpPending),
    seatingUnassigned: clamp(Math.round(p2), 0, weights.seatingUnassigned),
    suppliersPending: clamp(Math.round(p3), 0, weights.suppliersPending),
    tasksOverdue: clamp(Math.round(p4), 0, weights.tasksOverdue),
    budgetUnpaid: clamp(Math.round(p5), 0, weights.budgetUnpaid),
  };
});

/** -----------------------------
 * Tailwind colors (no hardcode)
 * ------------------------------ */
const readTailwindColor = (
  className: string,
  cssProp: 'color' | 'backgroundColor' = 'color',
) => {
  if (import.meta.server) return null;

  const el = document.createElement('span');
  el.className = className;
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.top = '-9999px';
  document.body.appendChild(el);

  const value = getComputedStyle(el)[cssProp];
  document.body.removeChild(el);

  return value || null;
};

const palette = ref({
  primary: '#857526',
  primaryLight: '#DAD3AB',
  track: 'rgba(0,0,0,0.08)',
  textStrong: 'rgba(0,0,0,0.85)',
  textMuted: 'rgba(0,0,0,0.65)',
});

onMounted(() => {
  palette.value = {
    primary: readTailwindColor('text-primary-500') ?? palette.value.primary,
    primaryLight:
      readTailwindColor('text-primary-200') ?? palette.value.primaryLight,
    track:
      readTailwindColor('bg-grey-100', 'backgroundColor') ??
      palette.value.track,
    textStrong: readTailwindColor('text-grey-900') ?? palette.value.textStrong,
    textMuted: readTailwindColor('text-grey-600') ?? palette.value.textMuted,
  };
});

/** -----------------------------
 * Chart
 * ------------------------------ */
const gaugeData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['Score', '—'],
  datasets: [
    {
      data: [score.value, Math.max(0, 100 - score.value)],
      backgroundColor: [palette.value.primary, palette.value.primaryLight],
      borderWidth: 0,
      hoverOffset: 0,
    },
  ],
}));

const centerTextPlugin = computed<Plugin<'doughnut'>>(() => ({
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!ctx || !chartArea) return;

    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = palette.value.textStrong;
    ctx.font = "900 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${score.value}%`, cx, cy - 2);

    ctx.fillStyle = palette.value.textMuted;
    ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText('Pontuação', cx, cy + 16);

    ctx.restore();
  },
}));

const gaugeOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
    datalabels: { display: false },
  },
}));

/** -----------------------------
 * Badge + smart tips
 * ------------------------------ */
const badge = computed(() => {
  const v = score.value;
  if (v >= 85)
    return {
      text: 'Excelente',
      cls: 'bg-success-50 text-success-700 border-success-200',
    };
  if (v >= 70)
    return {
      text: 'Bom',
      cls: 'bg-primary-50 text-primary-700 border-primary-200',
    };
  if (v >= 50)
    return {
      text: 'Atenção',
      cls: 'bg-warning-50 text-warning-700 border-warning-200',
    };
  return {
    text: 'Crítico',
    cls: 'bg-danger-50 text-danger-700 border-danger-200',
  };
});

type HealthRow = {
  key: 'rsvp' | 'seating' | 'suppliers' | 'checklist' | 'budget';
  label: string;
  shortDescription: string;
  percent: number;
  countText: string;
  weight: number;
  penalty: number;
};

const rows = computed<HealthRow[]>(() => [
  {
    key: 'rsvp',
    label: 'RSVP pendentes',
    shortDescription: 'Convites sem resposta.',
    percent: pendingRatePct.value,
    countText: `${guestsPending.value}/${guestsTotal.value}`,
    weight: weights.rsvpPending,
    penalty: penaltyPoints.value.rsvpPending,
  },
  {
    key: 'seating',
    label: 'Convidados sem mesa',
    shortDescription: 'Atribuição de lugares por fechar.',
    percent: unassignedRatePct.value,
    countText: `${unassignedGuests.value}/${guestsTotal.value}`,
    weight: weights.seatingUnassigned,
    penalty: penaltyPoints.value.seatingUnassigned,
  },
  {
    key: 'suppliers',
    label: 'Fornecedores pendentes',
    shortDescription: 'Confirmações em falta.',
    percent: suppliersPendingRatePct.value,
    countText: `${suppliersPending.value}/${suppliersTotal.value}`,
    weight: weights.suppliersPending,
    penalty: penaltyPoints.value.suppliersPending,
  },
  {
    key: 'checklist',
    label: 'Tarefas em atraso',
    shortDescription: 'Prazos vencidos.',
    percent: overdueRatePct.value,
    countText: `${tasksOverdue.value}/${tasksTotal.value}`,
    weight: weights.tasksOverdue,
    penalty: penaltyPoints.value.tasksOverdue,
  },
  {
    key: 'budget',
    label: 'Pagamentos por fazer',
    shortDescription: 'Parte do custo real ainda não paga.',
    percent: unpaidRatePct.value,
    countText:
      budgetActual.value > 0
        ? `${Math.round(budgetUnpaid.value)}/${Math.round(budgetActual.value)}`
        : '—',
    weight: weights.budgetUnpaid,
    penalty: penaltyPoints.value.budgetUnpaid,
  },
]);

const topIssue = computed(() => {
  const ordered = [...rows.value].sort((a, b) => b.penalty - a.penalty);
  return ordered[0];
});

const smartTip = computed(() => {
  const t = topIssue.value;
  if (!t || t.penalty === 0)
    return 'Tudo controlado. Mantém o registo semanal.';
  if (t.key === 'rsvp')
    return 'Envia um lembrete curto aos pendentes para fechar respostas.';
  if (t.key === 'seating')
    return 'Atribui os convidados sem mesa para evitar stress na véspera.';
  if (t.key === 'suppliers')
    return 'Confirma os fornecedores pendentes e valida a hora de chegada.';
  if (t.key === 'checklist')
    return 'Fecha primeiro as tarefas críticas que já estão em atraso.';
  return 'Revê pagamentos por fazer e prioriza os que impactam fornecedores.';
});
</script>

<template>
  <BaseCard title="Saúde do evento">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-grey-400 text-xs">Estado:</span>
          <span
            class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
            :class="badge.cls"
          >
            {{ badge.text }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-center">
        <div class="space-y-3">
          <div class="h-[200px]">
            <ClientOnly>
              <Doughnut
                :data="gaugeData"
                :options="gaugeOptions"
                :plugins="[centerTextPlugin]"
              />
            </ClientOnly>
          </div>
        </div>

        <div class="border-grey-100 rounded-2xl border bg-white p-3">
          <div class="space-y-2">
            <div
              v-for="r in rows"
              :key="r.key"
              class="bg-grey-50 flex items-start justify-between gap-4 rounded-xl px-3 py-2"
            >
              <div class="min-w-0">
                <p class="text-grey-900 text-xs font-semibold">
                  {{ r.label }}
                  <span class="text-grey-400 font-medium"
                    >· {{ r.percent }}%</span
                  >
                  <span
                    v-if="r.countText !== '—'"
                    class="text-grey-400 font-medium"
                  >
                    ({{ r.countText }})
                  </span>
                </p>

                <p class="text-grey-600 mt-0.5 text-[11px] leading-snug">
                  {{ r.shortDescription }}
                </p>
              </div>

              <div class="shrink-0 text-right">
                <p
                  class="text-[11px] font-semibold"
                  :class="
                    r.penalty === 0
                      ? 'text-success-700'
                      : r.penalty <= Math.round(r.weight * 0.35)
                        ? 'text-primary-700'
                        : r.penalty <= Math.round(r.weight * 0.7)
                          ? 'text-warning-700'
                          : 'text-danger-700'
                  "
                >
                  {{ r.penalty === 0 ? 'OK' : `-${r.penalty} pts` }}
                </p>
                <p class="text-grey-400 text-[10px]">Máx:{{ r.weight }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-grey-50 rounded-2xl px-3 py-2">
        <div class="text-grey-400 flex flex-wrap items-end gap-1 font-bold">
          <IconLightbulb :font-controlled="false" class="size-4" />
          <p class="text-[11px] leading-none">Dica inteligente</p>
        </div>
        <p class="text-grey-900 mt-2 text-[11px] font-semibold">
          {{ smartTip }}
        </p>
      </div>
    </div>
  </BaseCard>
</template>
