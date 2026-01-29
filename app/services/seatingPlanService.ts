import type { NitroFetchRequest, $Fetch } from 'nitropack';
const RESOURCE = '/SeatingPlans';

export const getSeatingPlanService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getOrCreateByEvent(eventId: number): Promise<SeatingPlan> {
    return await $fetch<SeatingPlan>(`${RESOURCE}/by-event/${eventId}`, {
      method: 'GET',
    });
  },

  async updateCanvas(
    planId: number,
    payload: UpdateSeatingPlanCanvas,
  ): Promise<SeatingPlan> {
    return await $fetch<SeatingPlan>(`${RESOURCE}/${planId}/canvas`, {
      method: 'PUT',
      body: payload,
    });
  },

  async upsertDeskLayout(
    planId: number,
    deskId: number,
    payload: UpsertDeskLayout,
  ): Promise<DeskLayout> {
    return await $fetch<DeskLayout>(`${RESOURCE}/${planId}/desks/${deskId}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async removeDeskFromMap(planId: number, deskId: number) {
    return $fetch<unknown>(`${RESOURCE}/${planId}/desks/${deskId}`, {
      method: 'DELETE',
    });
  },

  async addItem(
    planId: number,
    payload: UpsertSeatingPlanItem,
  ): Promise<SeatingPlanItem> {
    return await $fetch<SeatingPlanItem>(`${RESOURCE}/${planId}/items`, {
      method: 'POST',
      body: payload,
    });
  },

  async updateItem(
    planId: number,
    itemId: number,
    payload: UpsertSeatingPlanItem,
  ): Promise<SeatingPlanItem> {
    return await $fetch<SeatingPlanItem>(
      `${RESOURCE}/${planId}/items/${itemId}`,
      {
        method: 'PUT',
        body: payload,
      },
    );
  },

  async deleteItem(
    planId: number,
    itemId: number,
  ): Promise<{ success: boolean }> {
    return await $fetch<{ success: boolean }>(
      `${RESOURCE}/${planId}/items/${itemId}`,
      {
        method: 'DELETE',
      },
    );
  },
});
