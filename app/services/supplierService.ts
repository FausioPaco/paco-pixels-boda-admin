import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const EVENT_RESOURCE = '/Suppliers';
const CATALOG_RESOURCE = '/SupplierCatalog';

export const getSupplierService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  // =======================
  // Event Suppliers
  // =======================

  async getAllSuppliers(
    parameters: SupplierParameters,
  ): Promise<Pagination<Supplier>> {
    return fetchWithPagination<Supplier>($fetch, EVENT_RESOURCE, {
      query: parameters,
    });
  },

  async getSupplier(supplierId: number | string): Promise<Supplier> {
    return $fetch<Supplier>(`${EVENT_RESOURCE}/Get/${supplierId}`);
  },

  async createSupplier(newSupplier: SupplierInput): Promise<Supplier> {
    return $fetch<Supplier>(`${EVENT_RESOURCE}/Create`, {
      method: 'post',
      body: newSupplier,
    });
  },

  async updateSupplier(
    supplierId: number,
    updatedSupplier: SupplierInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${EVENT_RESOURCE}/Update/${supplierId}`, {
      method: 'put',
      body: updatedSupplier,
    });
  },

  async removeSupplier(supplierId: number): Promise<unknown> {
    return $fetch<unknown>(`${EVENT_RESOURCE}/Remove/${supplierId}`, {
      method: 'delete',
    });
  },

  async confirmSupplier(supplierId: number | string): Promise<unknown> {
    return $fetch<unknown>(`${EVENT_RESOURCE}/${supplierId}/Confirm`, {
      method: 'post',
    });
  },

  async unconfirmSupplier(supplierId: number | string): Promise<unknown> {
    return $fetch<unknown>(`${EVENT_RESOURCE}/${supplierId}/Unconfirm`, {
      method: 'post',
    });
  },

  // =======================
  // Supplier Catalog
  // =======================

  async getSupplierCatalog(
    parameters: SupplierCatalogParameters,
  ): Promise<Pagination<SupplierCatalogItem>> {
    return fetchWithPagination<SupplierCatalogItem>($fetch, CATALOG_RESOURCE, {
      query: parameters,
    });
  },

  async getSupplierCatalogItem(
    catalogItemId: number | string,
  ): Promise<SupplierCatalogItem> {
    return $fetch<SupplierCatalogItem>(`${CATALOG_RESOURCE}/${catalogItemId}`);
  },

  async createSupplierCatalogItem(
    input: SupplierCatalogItemInput,
  ): Promise<SupplierCatalogItem> {
    return $fetch<SupplierCatalogItem>(`${CATALOG_RESOURCE}`, {
      method: 'post',
      body: input,
    });
  },

  async updateSupplierCatalogItem(
    catalogItemId: number,
    input: SupplierCatalogItemInput,
  ): Promise<SupplierCatalogItem> {
    return $fetch<SupplierCatalogItem>(`${CATALOG_RESOURCE}/${catalogItemId}`, {
      method: 'put',
      body: input,
    });
  },

  async removeSupplierCatalogItem(catalogItemId: number): Promise<unknown> {
    return $fetch<unknown>(`${CATALOG_RESOURCE}/${catalogItemId}`, {
      method: 'delete',
    });
  },

  async addSupplierFromCatalogToEvent(
    catalogItemId: number,
    eventId: number,
  ): Promise<Supplier> {
    return $fetch<Supplier>(`${CATALOG_RESOURCE}/${catalogItemId}/AddToEvent`, {
      method: 'post',
      query: { eventId },
    });
  },
});
