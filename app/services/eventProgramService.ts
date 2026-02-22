import type { NitroFetchRequest, $Fetch } from 'nitropack';

const RESOURCE = '/EventProgram';

export const getEventProgramService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getByEvent(eventId: number, isInternal = false): Promise<EventProgram> {
    return $fetch<EventProgram>(`${RESOURCE}`, {
      query: { eventId, isInternal },
    });
  },

  async updateMode(
    eventId: number,
    input: EventProgramUpdateMode,
    isInternal = false,
  ): Promise<EventProgram> {
    return $fetch<EventProgram>(`${RESOURCE}/mode`, {
      method: 'PUT',
      query: { eventId, isInternal },
      body: input,
    });
  },

  async addItem(
    eventId: number,
    input: EventProgramItemForCreation,
    isInternal = false,
  ): Promise<EventProgramItem> {
    return $fetch<EventProgramItem>(`${RESOURCE}/items`, {
      method: 'POST',
      query: { eventId, isInternal },
      body: input,
    });
  },

  async updateItem(
    eventId: number,
    itemId: number,
    input: EventProgramItemForUpdate,
    isInternal = false,
  ): Promise<EventProgramItem> {
    return $fetch<EventProgramItem>(`${RESOURCE}/items/${itemId}`, {
      method: 'PUT',
      query: { eventId, isInternal },
      body: input,
    });
  },

  async deleteItem(
    eventId: number,
    itemId: number,
    isInternal = false,
  ): Promise<void> {
    await $fetch(`${RESOURCE}/items/${itemId}`, {
      method: 'DELETE',
      query: { eventId, isInternal },
    });
  },

  async reorderItems(
    eventId: number,
    input: EventProgramItemsReorder,
    isInternal = false,
  ): Promise<EventProgram> {
    return $fetch<EventProgram>(`${RESOURCE}/items/reorder`, {
      method: 'PUT',
      query: { eventId, isInternal },
      body: input,
    });
  },

  async uploadProgramFile(
    eventId: number,
    file: File,
    isInternal = false,
  ): Promise<EventProgram> {
    const form = new FormData();
    form.append('file', file);

    return $fetch<EventProgram>(`${RESOURCE}/upload`, {
      method: 'POST',
      query: { eventId, isInternal },
      body: form,
    });
  },
});
