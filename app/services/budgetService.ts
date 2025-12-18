import type { NitroFetchRequest, $Fetch } from 'nitropack';

const RESOURCE = '/Budgets';
const TEMPLATE_RESOURCE = '/BudgetTemplates';

export const getBudgetService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  // ===== Budget (por evento) =====
  async getByEvent(eventId: number): Promise<Budget> {
    return $fetch<Budget>(`${RESOURCE}/by-event/${eventId}`);
  },

  async create(input: BudgetCreateInput): Promise<Budget> {
    return $fetch<Budget>(`${RESOURCE}`, { method: 'POST', body: input });
  },

  async updateHeader(
    budgetId: number,
    input: BudgetUpsertInput,
  ): Promise<Budget> {
    return $fetch<Budget>(`${RESOURCE}/${budgetId}`, {
      method: 'PUT',
      body: input,
    });
  },

  // toggle “seguro”: usa o updateHeader (não depende de endpoint dedicado).
  async setControlMode(
    budgetId: number,
    current: Pick<Budget, 'totalBudget' | 'currency'>,
    controlMode: BudgetControlMode,
  ): Promise<Budget> {
    return $fetch<Budget>(`${RESOURCE}/${budgetId}`, {
      method: 'PUT',
      body: {
        totalBudget: current.totalBudget,
        currency: current.currency,
        controlMode,
      },
    });
  },

  // ===== Categories =====
  async addCategory(
    budgetId: number,
    input: BudgetCategoryInput,
  ): Promise<BudgetCategory> {
    return $fetch<BudgetCategory>(`${RESOURCE}/${budgetId}/categories`, {
      method: 'POST',
      body: input,
    });
  },

  async updateCategory(
    categoryId: number,
    input: BudgetCategoryInput,
  ): Promise<BudgetCategory> {
    return $fetch<BudgetCategory>(`${RESOURCE}/categories/${categoryId}`, {
      method: 'PUT',
      body: input,
    });
  },

  async deleteCategory(categoryId: number): Promise<void> {
    return await $fetch(`${RESOURCE}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  async reorderCategories(
    budgetId: number,
    items: ReorderItem[],
  ): Promise<void> {
    return await $fetch(`${RESOURCE}/${budgetId}/categories/reorder`, {
      method: 'PUT',
      body: { items } as ReorderRequest,
    });
  },

  // ===== Items =====
  async addItem(
    categoryId: number,
    input: BudgetItemInput,
  ): Promise<BudgetItem> {
    return $fetch<BudgetItem>(`${RESOURCE}/categories/${categoryId}/items`, {
      method: 'POST',
      body: input,
    });
  },

  async updateItem(
    itemId: number,
    input: BudgetItemInput,
  ): Promise<BudgetItem> {
    return $fetch<BudgetItem>(`${RESOURCE}/items/${itemId}`, {
      method: 'PUT',
      body: input,
    });
  },

  async deleteItem(itemId: number): Promise<void> {
    return await $fetch(`${RESOURCE}/items/${itemId}`, { method: 'DELETE' });
  },

  async reorderItems(categoryId: number, items: ReorderItem[]): Promise<void> {
    return await $fetch(`${RESOURCE}/categories/${categoryId}/items/reorder`, {
      method: 'PUT',
      body: { items } as ReorderRequest,
    });
  },

  // ===== Templates =====

  async getTemplate(templateId: number): Promise<BudgetTemplate> {
    return $fetch<BudgetTemplate>(`${TEMPLATE_RESOURCE}/${templateId}`);
  },

  async createTemplate(
    input: BudgetTemplateCreateInput,
  ): Promise<BudgetTemplate> {
    return $fetch<BudgetTemplate>(`${TEMPLATE_RESOURCE}`, {
      method: 'POST',
      body: input,
    });
  },

  async updateTemplate(
    templateId: number,
    input: BudgetTemplateUpdateInput,
  ): Promise<BudgetTemplate> {
    return $fetch<BudgetTemplate>(`${TEMPLATE_RESOURCE}/${templateId}`, {
      method: 'PUT',
      body: input,
    });
  },

  async deleteTemplate(templateId: number): Promise<void> {
    await $fetch(`${TEMPLATE_RESOURCE}/${templateId}`, { method: 'DELETE' });
  },

  async addTemplateCategory(
    templateId: number,
    input: BudgetTemplateCategoryInput,
  ): Promise<BudgetTemplateCategory> {
    return $fetch<BudgetTemplateCategory>(
      `${TEMPLATE_RESOURCE}/${templateId}/categories`,
      {
        method: 'POST',
        body: input,
      },
    );
  },

  async updateTemplateCategory(
    categoryId: number,
    input: BudgetTemplateCategoryInput,
  ): Promise<BudgetTemplateCategory> {
    return $fetch<BudgetTemplateCategory>(
      `${TEMPLATE_RESOURCE}/categories/${categoryId}`,
      {
        method: 'PUT',
        body: input,
      },
    );
  },

  async deleteTemplateCategory(categoryId: number): Promise<void> {
    return await $fetch(`${TEMPLATE_RESOURCE}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  async reorderTemplateCategories(
    templateId: number,
    items: ReorderItem[],
  ): Promise<void> {
    return await $fetch(
      `${TEMPLATE_RESOURCE}/${templateId}/categories/reorder`,
      {
        method: 'PUT',
        body: { items } as ReorderRequest,
      },
    );
  },

  async addTemplateItem(
    categoryId: number,
    input: BudgetTemplateItemInput,
  ): Promise<BudgetTemplateItem> {
    return $fetch<BudgetTemplateItem>(
      `${TEMPLATE_RESOURCE}/categories/${categoryId}/items`,
      {
        method: 'POST',
        body: input,
      },
    );
  },

  async updateTemplateItem(
    itemId: number,
    input: BudgetTemplateItemInput,
  ): Promise<BudgetTemplateItem> {
    return $fetch<BudgetTemplateItem>(`${TEMPLATE_RESOURCE}/items/${itemId}`, {
      method: 'PUT',
      body: input,
    });
  },

  async deleteTemplateItem(itemId: number): Promise<void> {
    return await $fetch(`${TEMPLATE_RESOURCE}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  async reorderTemplateItems(
    categoryId: number,
    items: ReorderItem[],
  ): Promise<void> {
    return await $fetch(
      `${TEMPLATE_RESOURCE}/categories/${categoryId}/items/reorder`,
      {
        method: 'PUT',
        body: { items } as ReorderRequest,
      },
    );
  },

  async getTemplateByEventType(
    eventTypeId: number,
    opts?: { partnerId?: number }, // só para Super Administrador
  ): Promise<BudgetTemplate> {
    return $fetch<BudgetTemplate>(
      `${TEMPLATE_RESOURCE}/by-event-type/${eventTypeId}`,
      {
        query: opts?.partnerId ? { partnerId: opts.partnerId } : undefined,
      },
    );
  },

  async toggleTemplateControlMode(
    templateId: number,
    controlMode: BudgetControlMode,
  ): Promise<BudgetTemplate> {
    return $fetch<BudgetTemplate>(
      `${TEMPLATE_RESOURCE}/${templateId}/toggle-control-mode`,
      {
        method: 'PUT',
        body: { controlMode },
      },
    );
  },
});
