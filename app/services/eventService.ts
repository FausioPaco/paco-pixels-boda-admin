import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Events';

export const getEventService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllEvents(parameters: EventParameters): Promise<Pagination<Event>> {
    return fetchWithPagination<Event>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async getEvent(eventId: number | string): Promise<Event> {
    return $fetch<Event>(`${RESOURCE}/Get/${eventId}`);
  },

  async createEvent(newEvent: EventInput): Promise<Event> {
    return $fetch<Event>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newEvent,
    });
  },

  async updateEvent(
    eventId: number,
    updatedEvent: EventInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Update/${eventId}`, {
      method: 'put',
      body: updatedEvent,
    });
  },

  async removeEvent(eventId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Remove/${eventId}`, {
      method: 'delete',
    });
  },

  async getEventTypes(): Promise<EventType[]> {
    return $fetch<EventType[]>(`${RESOURCE}/Types`);
  },
});
