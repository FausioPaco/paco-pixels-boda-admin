export interface Supplier {
  id: string | number;
  name: string;
  job_Description: string;
  phone: string;
  eventId?: number;
  eventName: string;
  isConfirmed: boolean;
  confirmed_At?: string | null;
  confirmed_By_Id?: number | null;
  unconfirmed_At?: string | null;
  unconfirmed_By_Id?: number | null;
  supplierCatalogItemId?: number | null;
}

export interface SupplierInput {
  name: string;
  job_Description: string;
  phone: string;
  eventId?: number;
  supplierCatalogItemId?: number | null;
}

export interface SupplierParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}

export interface SupplierCatalogItem {
  id: number;
  name: string;
  job_Description: string;
  phone: string;
  isActive: boolean;
}

export interface SupplierCatalogItemInput {
  name: string;
  job_Description: string;
  phone: string;
  isActive?: boolean;
}

export interface SupplierCatalogParameters {
  searchQuery: string;
  pageNumber: number;
  pageSize: number;
  isActive?: boolean | null;
}
