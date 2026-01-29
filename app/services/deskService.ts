import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Desks';

export const getDeskService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllDesks(parameters: DeskParameters): Promise<Pagination<Desk>> {
    return fetchWithPagination<Desk>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async exportDesks(parameters: DeskParameters): Promise<Blob> {
    return $fetch<Blob>(`${RESOURCE}/Export`, {
      params: parameters,
    });
  },

  async getDeskOptions(eventId: number): Promise<DeskOption[]> {
    return $fetch<DeskOption[]>(`${RESOURCE}/Options/${eventId}`);
  },

  async getDesk(deskId: number | string): Promise<Desk> {
    return $fetch<Desk>(`${RESOURCE}/Get/${deskId}`);
  },

  async createDesk(newDesk: DeskInput): Promise<Desk> {
    return $fetch<Desk>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newDesk,
    });
  },

  async updateDesk(deskId: number, updatedDesk: DeskInput): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Update/${deskId}`, {
      method: 'put',
      body: updatedDesk,
    });
  },

  async removeDesk(deskId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Remove/${deskId}`, {
      method: 'delete',
    });
  },

  async getSeatingSnapshot(eventId: number): Promise<DeskSeatingSnapshot> {
    return await $fetch<DeskSeatingSnapshot>(
      `${RESOURCE}/SeatingSnapshot/${eventId}`,
      {
        method: 'GET',
      },
    );
  },
});
