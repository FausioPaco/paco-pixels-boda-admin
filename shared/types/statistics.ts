export type Severity = 'info' | 'warning' | 'danger';

export interface TimeSeriesPoint {
  date: string; // ISO string
  value: number;
}

export interface OverviewStats {
  daysRemaining: number;
  operationalStatus: string; // "Em preparação" | "Semana do evento" | "Hoje" | "Concluído"
  healthScore: number; // 0-100
  attentionItemsCount: number;
  lastUpdatedAt?: string | null;
}

export interface AttentionItem {
  key: string;
  title: string;
  severity: Severity;
  count: number;
  route: string;
}

export interface GuestsStats {
  // Convites (registos de Guest)
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  confirmationRate: number; // 0-100

  // Pessoas (somatório de People_Count / People_Confirmed)
  peopleTotal: number;
  peopleConfirmed: number;
  peopleDeclined: number;
  peoplePending: number;
  peopleConfirmationRate: number; // 0-100

  rsvpActivityTimeline: TimeSeriesPoint[];
}

export interface SeatingStats {
  tablesCount: number;
  seatsCapacity: number;
  assignedGuests: number;
  unassignedGuests: number;
  occupancyRate: number; // 0-100
}

export interface CategoryValue {
  categoryId: number;
  title: string;
  iconKey: string;
  estimated: number;
  actual: number;
  paid: number;
}

export interface BudgetStats {
  currency: string; // "MZN"
  totalPlannedBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  totalUnpaid: number;
  remainingVsBudget: number;
  topCategories: CategoryValue[];
}

export interface SuppliersStats {
  total: number;
  confirmed: number;
  pending: number;
  absent: number;
  confirmedNotArrived: number;
}

export interface ChecklistStats {
  total: number;
  done: number;
  overdue: number;
  dueSoon: number;
  completionRate: number; // 0-100
}

export interface EventDashboardStats {
  overview: OverviewStats;
  guests: GuestsStats;
  seating: SeatingStats;
  budget: BudgetStats;
  suppliers: SuppliersStats;
  checklist: ChecklistStats;
  attention: AttentionItem[];
}

export type DashboardStatsRange =
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'thisYear'
  | 'all';

export type DashboardStatsParameters = {
  eventId: number;
  range?: DashboardStatsRange;
  from?: string;
  to?: string;
};
