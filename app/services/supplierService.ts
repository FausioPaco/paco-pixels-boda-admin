import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Suppliers';

export const getSupplierService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getAllSuppliers(
    parameters: SupplierParameters,
  ): Promise<Pagination<Supplier>> {
    return fetchWithPagination<Supplier>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async getSupplier(supplierId: number | string): Promise<Supplier> {
    return $fetch<Supplier>(`${RESOURCE}/Get/${supplierId}`);
  },

  async createSupplier(newSupplier: SupplierInput): Promise<Supplier> {
    return $fetch<Supplier>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newSupplier,
    });
  },

  async updateSupplier(
    supplierId: number,
    updatedSupplier: SupplierInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Update/${supplierId}`, {
      method: 'put',
      body: updatedSupplier,
    });
  },

  async removeSupplier(supplierId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Remove/${supplierId}`, {
      method: 'delete',
    });
  },
});
