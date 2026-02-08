import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Guests';

export const getGuestService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllGuests(parameters: GuestParameters): Promise<Pagination<Guest>> {
    return fetchWithPagination<Guest>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async searchGuestsLite(eventId: number, q: string): Promise<Guest[]> {
    const res = await fetchWithPagination<Guest>($fetch, RESOURCE, {
      params: {
        eventId,
        searchQuery: q,
        pageNumber: 1,
        pageSize: 10,
        availability_Type: '',
        startDate: '',
        endDate: '',
        categoryId: null,
      },
    });

    return res.data as Guest[];
  },

  async assignSeat(
    guestId: number,
    payload: { deskId: number; seatNumber: number },
  ) {
    return $fetch<unknown>(`${RESOURCE}/${guestId}/seat`, {
      body: payload,
      method: 'put',
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

  async getGuestCategories(
    eventTypeSlug: string | undefined | null,
  ): Promise<GuestCategory[]> {
    return $fetch<GuestCategory[]>(`${RESOURCE}/Categories`, {
      query: {
        eventType: eventTypeSlug,
      },
    });
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

  async declareAbsence(
    guestId: number,
    payload: DeclareAbsenceInput,
  ): Promise<Guest> {
    return $fetch<Guest>(`${RESOURCE}/DeclareAbsence/${guestId}`, {
      method: 'post',
      body: payload,
    });
  },
});
