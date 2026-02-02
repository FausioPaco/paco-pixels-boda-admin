import type { NitroFetchRequest, $Fetch } from 'nitropack';

const RESOURCE = '/EventProgram';

export const getEventProgramService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getByEvent(eventId: number): Promise<EventProgram> {
    return $fetch<EventProgram>(`${RESOURCE}`, {
      query: { eventId },
    });
  },

  async updateMode(
    eventId: number,
    input: EventProgramUpdateMode,
  ): Promise<EventProgram> {
    return $fetch<EventProgram>(`${RESOURCE}/mode`, {
      method: 'PUT',
      query: { eventId },
      body: input,
    });
  },

  async addItem(
    eventId: number,
    input: EventProgramItemForCreation,
  ): Promise<EventProgramItem> {
    return $fetch<EventProgramItem>(`${RESOURCE}/items`, {
      method: 'POST',
      query: { eventId },
      body: input,
    });
  },

  async updateItem(
    eventId: number,
    itemId: number,
    input: EventProgramItemForUpdate,
  ): Promise<EventProgramItem> {
    return $fetch<EventProgramItem>(`${RESOURCE}/items/${itemId}`, {
      method: 'PUT',
      query: { eventId },
      body: input,
    });
  },

  async deleteItem(eventId: number, itemId: number): Promise<void> {
    await $fetch(`${RESOURCE}/items/${itemId}`, {
      method: 'DELETE',
      query: { eventId },
    });
  },

  async reorderItems(
    eventId: number,
    input: EventProgramItemsReorder,
  ): Promise<EventProgram> {
    return $fetch<EventProgram>(`${RESOURCE}/items/reorder`, {
      method: 'PUT',
      query: { eventId },
      body: input,
    });
  },

  async uploadProgramFile(eventId: number, file: File): Promise<EventProgram> {
    const form = new FormData();
    form.append('file', file);

    return $fetch<EventProgram>(`${RESOURCE}/upload`, {
      method: 'POST',
      query: { eventId },
      body: form,
    });
  },
});
