export interface Supplier {
  id: string | number;
  name: string;
  job_Description: string;
  phone: string;
  eventId?: number;
  eventName: string;
}

export interface SupplierInput {
  name: string;
  job_Description: string;
  phone: string;
  eventId?: number;
}

export interface SupplierParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}
