import type { NitroFetchRequest, $Fetch } from 'nitropack';

const RESOURCE = '/EventGiftList';

export const getEventGiftListService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getByEvent(eventId: number): Promise<EventGiftList> {
    return $fetch<EventGiftList>(`${RESOURCE}`, {
      query: { eventId },
    });
  },

  async updateMode(
    eventId: number,
    input: EventGiftListUpdateMode,
  ): Promise<EventGiftList> {
    return $fetch<EventGiftList>(`${RESOURCE}/mode`, {
      method: 'PUT',
      query: { eventId },
      body: input,
    });
  },

  async updateEditor(
    eventId: number,
    input: EventGiftListEditorUpdate,
  ): Promise<EventGiftList> {
    return $fetch<EventGiftList>(`${RESOURCE}/editor`, {
      method: 'PUT',
      query: { eventId },
      body: input,
    });
  },

  async uploadGiftListFile(
    eventId: number,
    file: File,
  ): Promise<EventGiftList> {
    const form = new FormData();
    form.append('file', file);

    return $fetch<EventGiftList>(`${RESOURCE}/upload`, {
      method: 'POST',
      query: { eventId },
      body: form,
    });
  },
});
