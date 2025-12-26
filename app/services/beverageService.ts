import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BEVERAGE_RESOURCE = '/BeverageCatalog';
const EVENT_BEVERAGE_RESOURCE = '/EventBeverages';

export const getBeverageCatalogService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getCatalogItems(
    parameters: BeverageCatalogParameters,
  ): Promise<Pagination<BeverageCatalogItem>> {
    return fetchWithPagination<BeverageCatalogItem>($fetch, BEVERAGE_RESOURCE, {
      query: parameters,
    });
  },

  async search(
    input: BeverageCatalogSearchInput,
  ): Promise<BeverageCatalogItem[]> {
    return $fetch<BeverageCatalogItem[]>(`${BEVERAGE_RESOURCE}/Search`, {
      query: {
        q: input.q,
        categoryId: input.categoryId ?? undefined,
        take: input.take ?? 10,
      },
    });
  },

  async getCategories(
    parameters: BeverageCategoriesParameters,
  ): Promise<Pagination<BeverageCategory>> {
    return fetchWithPagination<BeverageCategory>(
      $fetch,
      `${BEVERAGE_RESOURCE}/categories`,
      {
        query: parameters,
      },
    );
  },

  async createCategory(
    input: BeverageCategoryCreateInput,
  ): Promise<BeverageCategory> {
    return $fetch<BeverageCategory>(`${BEVERAGE_RESOURCE}/categories`, {
      method: 'post',
      body: input,
    });
  },

  async getEventBeverages(
    parameters: EventBeveragesParameters,
  ): Promise<Pagination<EventBeverage>> {
    return fetchWithPagination<EventBeverage>($fetch, EVENT_BEVERAGE_RESOURCE, {
      query: parameters,
    });
  },

  /**
   * Criar bebida
   * POST /api/EventBeverages/Create?eventId=...
   */
  async createEventBeverage(
    eventId: number,
    input: EventBeverageCreateInput,
  ): Promise<EventBeverage> {
    return $fetch<EventBeverage>(`${EVENT_BEVERAGE_RESOURCE}/Create`, {
      method: 'post',
      query: { eventId },
      body: input,
    });
  },

  /**
   * Actualizar bebida
   * PUT /api/EventBeverages/Update/{beverageId}?eventId=...
   */
  async updateEventBeverage(
    eventId: number,
    beverageId: number,
    input: EventBeverageUpdateInput,
  ): Promise<EventBeverage> {
    return $fetch<EventBeverage>(
      `${EVENT_BEVERAGE_RESOURCE}/Update/${beverageId}`,
      {
        method: 'put',
        query: { eventId },
        body: input,
      },
    );
  },

  /**
   * Remover (soft delete)
   * DELETE /api/EventBeverages/Remove/{beverageId}?eventId=...
   */
  async removeEventBeverage(
    eventId: number,
    beverageId: number,
  ): Promise<void> {
    await $fetch(`${EVENT_BEVERAGE_RESOURCE}/Remove/${beverageId}`, {
      method: 'delete',
      query: { eventId },
    });
  },

  /**
   * Movimento de stock (dia do evento)
   * POST /api/EventBeverages/Movements/{beverageId}?eventId=...
   * Retorna: { currentUnits, status }
   */
  async addStockMovement(
    eventId: number,
    beverageId: number,
    input: StockMovementCreateInput,
  ): Promise<EventBeverageStockUpdateResult> {
    return $fetch<EventBeverageStockUpdateResult>(
      `${EVENT_BEVERAGE_RESOURCE}/Movements/${beverageId}`,
      {
        method: 'post',
        query: { eventId },
        body: input,
      },
    );
  },

  /**
   * Activar modo Dia do Evento
   * POST /api/EventBeverages/Mode/EventDay?eventId=...
   */
  async enableEventDayMode(eventId: number): Promise<{ message: string }> {
    return $fetch<{ message: string }>(
      `${EVENT_BEVERAGE_RESOURCE}/Mode/EventDay`,
      {
        method: 'post',
        query: { eventId },
      },
    );
  },

  /**
   * Activar modo Planeamento
   * POST /api/EventBeverages/Mode/EventDay?eventId=...
   */
  async enableEventPlanningMode(eventId: number): Promise<{ message: string }> {
    return $fetch<{ message: string }>(
      `${EVENT_BEVERAGE_RESOURCE}/Mode/Planning`,
      {
        method: 'post',
        query: { eventId },
      },
    );
  },

  async restock(
    eventId: number,
    input: RestockBeveragesInput,
  ): Promise<RestockBeveragesResult> {
    return $fetch<RestockBeveragesResult>(
      `${EVENT_BEVERAGE_RESOURCE}/Restock`,
      {
        method: 'post',
        query: { eventId },
        body: input,
      },
    );
  },
});
