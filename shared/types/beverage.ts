export enum BeveragePurchaseMode {
  Unit = 1,
  Box = 2,
}

export enum BeverageStockMovementType {
  In = 1,
  Out = 2,
  Adjust = 3,
  MarkOutOfStock = 4,
}

export enum BeverageModuleStatus {
  Planning = 1,
  EventDay = 2,
  Closed = 3,
}

export type EventBeverageStockStatus =
  | 'OK'
  | 'Low'
  | 'OutOfStock'
  | 'ok'
  | 'low'
  | 'outofstock'
  | '';

/**
 * ===== Catálogo Global =====
 */
export interface BeverageCategory {
  id: number;
  name: string;
  slug: string;
  iconKey: string | null | undefined;
}

export interface BeverageCatalogItem {
  id: number;
  name: string;
  categoryId: number;
  defaultUnitsPerBox: number | null | undefined;
  defaultPurchaseMode: 'Unit' | 'Box' | null | undefined;
}

export interface BeverageCatalogParameters {
  searchQuery?: string;
  categoryId?: number | null | undefined;
  pageNumber?: number;
  pageSize?: number;
  onlyActive?: boolean;
  take?: number | null | undefined;
}

export interface BeverageCategoriesParameters {
  searchQuery?: string;
  pageNumber?: number;
  pageSize?: number;
  take?: number | null | undefined;
}

export interface BeverageCategoryCreateInput {
  name: string;
}

/**
 * Endpoint opcional /Search (autocomplete sem paginação completa)
 */
export interface BeverageCatalogSearchInput {
  q: string;
  categoryId?: number | null | undefined;
  take?: number;
}

/**
 * ===== Bebidas do Evento =====
 */
export interface EventBeverage {
  id: number;
  eventId: number;
  name: string;
  beverageCategoryId: number;
  beverageCategoryName: string;
  purchaseMode: BeveragePurchaseMode;
  unitsPerBox: number | null | undefined;
  boxesQty: number | null | undefined;
  initialUnits: number;
  minimumUnits: number;
  currentUnits: number;
  status: EventBeverageStockStatus;
  notes: string | null | undefined;
}

export interface EventBeveragesParameters {
  eventId?: number;
  searchQuery?: string;
  categoryId?: number | null | undefined;
  stockStatus?: EventBeverageStockStatus;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface EventBeverageCreateInput {
  name: string;
  beverageCategoryId: number;
  purchaseMode: BeveragePurchaseMode;
  unitsPerBox?: number | null | undefined;
  boxesQty?: number | null | undefined;
  initialUnits?: number | null | undefined;
  minimumUnits: number | undefined;
  notes?: string | null | undefined;
}

export interface EventBeverageUpdateInput {
  name: string;
  beverageCategoryId: number;
  purchaseMode: BeveragePurchaseMode;
  unitsPerBox?: number | null | undefined;
  boxesQty?: number | null | undefined;
  initialUnits?: number | null | undefined;
  minimumUnits: number | null | undefined;
  notes?: string | null | undefined;
}

/**
 * ===== Movimentos de Stock =====
 */
export interface StockMovement {
  id: number;
  eventId: number;
  eventBeverageId: number;
  type: 'In' | 'Out' | 'Adjust' | 'MarkOutOfStock';
  quantity: number;
  occurredAt: string;
  note: string | null | undefined;
  beverageName?: string | null | undefined;
}

export interface StockMovementCreateInput {
  type: BeverageStockMovementType;
  quantity: number;
  occurredAt?: string | null | undefined;
  note?: string | null | undefined;
}

export interface EventBeverageStockUpdateResult {
  currentUnits: number;
  status: EventBeverageStockStatus;
}

export interface EventBeverageSettings {
  eventId: number;
  status: BeverageModuleStatus;
  allowAddBeveragesInEventDay: boolean;
}

export interface RestockBeverageItemInput {
  eventBeverageId: number;
  quantity: number | null;
  boxesQty: number | null;
  note?: string | null;
}

export interface RestockBeveragesInput {
  items: RestockBeverageItemInput[];
  occurredAt?: string | null;
  note?: string | null;
}

export interface RestockBeveragesResult {
  updatedCount: number;
}

export interface BeverageStockReportParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}
