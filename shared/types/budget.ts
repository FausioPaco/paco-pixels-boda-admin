export enum BudgetControlMode {
  Controllable = 1,
  NonControllable = 2,
}

export interface BudgetTotals {
  estimatedTotal: number;
  actualTotal: number;
  paidTotal: number;
  dueTotal: number;
  isOverBudget: boolean;
  overBudgetBy: number;
}

export interface BudgetCategoryTotals {
  estimatedTotal: number;
  actualTotal: number;
  paidTotal: number;
  dueTotal: number;
}

export interface BudgetItem {
  id: number;
  budgetCategoryId: number;
  title: string;
  estimatedAmount: number;
  actualCost: number;
  paidAmount: number;
  dueAmount: number;
  notes: string;
  sortOrder: number;
}

export interface BudgetCategory {
  id: number;
  budgetId: number;
  title: string;
  iconKey: string;
  sortOrder: number;
  totals?: BudgetCategoryTotals;
  items: BudgetItem[];
}

export interface Budget {
  id: number;
  eventId: number;
  totalBudget: number;
  currency: string;
  controlMode: BudgetControlMode;
  totals?: BudgetTotals;
  warnings: string[];
  categories: BudgetCategory[];
}

export interface BudgetCreateInput {
  eventId: number;
  totalBudget: number;
  currency?: string;
  controlMode: BudgetControlMode;
}

export interface BudgetUpsertInput {
  totalBudget: number;
  currency?: string;
  controlMode: BudgetControlMode;
}

export interface BudgetCategoryInput {
  title: string;
}

export interface BudgetItemInput {
  title: string;
  estimatedAmount: number;
  actualCost: number;
  paidAmount: number;
  notes?: string | null;
  sortOrder: number;
}

export interface ReorderItem {
  id: number;
  sortOrder: number;
}

export interface ReorderRequest {
  items: ReorderItem[];
}

// ===== Templates =====
export interface BudgetTemplateItem {
  id: number;
  budgetTemplateCategoryId: number;
  title: string;
  estimatedAmount: number;
  actualCost: number;
  paidAmount: number;
  notes: string;
  sortOrder: number;
}

export interface BudgetTemplateCategory {
  id: number;
  budgetTemplateId: number;
  title: string;
  iconKey: string;
  sortOrder: number;
  items: BudgetTemplateItem[];
}

export interface BudgetTemplate {
  id: number;
  partnerId: number;
  eventTypeId: number;
  title: string;
  baseTotalBudget: number;
  currency: string;
  defaultControlMode: BudgetControlMode;
  categories: BudgetTemplateCategory[];
}

export interface BudgetTemplateCreateInput {
  eventTypeId: number;
  title: string;
  baseTotalBudget: number;
  currency: string;
  defaultControlMode: BudgetControlMode;
}

export interface BudgetTemplateUpdateInput {
  title: string;
  baseTotalBudget: number;
  currency: string | undefined;
  defaultControlMode: BudgetControlMode;
}

export interface BudgetTemplateCategoryInput {
  title: string;
}

export interface BudgetTemplateItemInput {
  title: string;
  estimatedAmount: number;
  actualCost: number;
  paidAmount: number;
  notes?: string | null;
  sortOrder: number;
}

export type BudgetCurrency = 'MZN' | 'USD';

export const BUDGET_CONTROL_MODES = [
  {
    id: 'NonControllable',
    value: BudgetControlMode.NonControllable,
    name: 'Não controlável',
  },
  {
    id: 'Controllable',
    value: BudgetControlMode.Controllable,
    name: 'Controlável',
  },
];
export const BUDGET_CURRENCIES = [
  { id: 'MZN', value: 'MZN', name: 'Metical (MZN)' },
  { id: 'USD', value: 'USD', name: 'Dólar (USD)' },
];
