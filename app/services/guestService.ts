import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Guests';

export const getGuestService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllGuests(parameters: GuestParameters): Promise<Pagination<Guest>> {
    return fetchWithPagination<Guest>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async exportGuests(parameters: GuestParameters): Promise<Blob> {
    return $fetch<Blob>(`${RESOURCE}/ExportByLocalId`, {
      params: parameters,
    });
  },

  async exportGuestsAsPdf(parameters: GuestParameters): Promise<Blob> {
    return $fetch<Blob>(`${RESOURCE}/ExportPdf`, { params: parameters });
  },

  async getGuestCategories(): Promise<GuestCategory[]> {
    return $fetch<GuestCategory[]>(`${RESOURCE}/Categories`);
  },

  async getGuest(guestId: number | string): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/Get/${guestId}`);
  },

  async getGuestByLocalId(eventId: number, guestId: number): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/GetLocal/${eventId}`, {
      params: { guestId },
    });
  },

  async createGuest(newGuest: GuestInput): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newGuest,
    });
  },

  async updateGuest(
    guestId: number,
    updatedGuest: GuestInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Update/${guestId}`, {
      method: 'put',
      body: updatedGuest,
    });
  },

  async removeGuest(guestId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Remove/${guestId}`, {
      method: 'delete',
    });
  },

  async confirmPresence(guestId: number): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/Confirm/${guestId}`, {
      method: 'post',
    });
  },

  async confirmPresenceAdvanced(
    guestId: number,
    payload: ConfirmPresenceInput,
  ): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/ConfirmPresenceAdvanced/${guestId}`, {
      method: 'post',
      body: payload,
    });
  },

  async confirmArrival(guestId: number): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/Arrived/${guestId}`, {
      method: 'post',
    });
  },

  async cancelArrival(guestId: number): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/CancelArrived/${guestId}`, {
      method: 'post',
    });
  },
});
