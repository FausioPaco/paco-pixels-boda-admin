import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Checklists';

export const getChecklistService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getAllSections(
    parameters: ChecklistSectionParameters,
  ): Promise<Pagination<ChecklistSection>> {
    return fetchWithPagination<ChecklistSection>(
      $fetch,
      `${RESOURCE}/Sections`,
      {
        query: parameters,
      },
    );
  },

  async getSectionOptions(eventId: number): Promise<ChecklistSectionOption[]> {
    return $fetch<ChecklistSectionOption[]>(
      `${RESOURCE}/Sections/Options/${eventId}`,
    );
  },

  async getSection(sectionId: number): Promise<ChecklistSection> {
    return $fetch<ChecklistSection>(`${RESOURCE}/Sections/Get/${sectionId}`);
  },

  async createSection(
    newSection: ChecklistSectionInput,
  ): Promise<ChecklistSection> {
    return $fetch<ChecklistSection>(`${RESOURCE}/Sections/Create`, {
      method: 'post',
      body: newSection,
    });
  },

  async updateSection(
    sectionId: number,
    updatedSection: ChecklistSectionInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Sections/Update/${sectionId}`, {
      method: 'put',
      body: updatedSection,
    });
  },

  async removeSection(sectionId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Sections/Remove/${sectionId}`, {
      method: 'delete',
    });
  },

  async reorderSections(
    eventId: number,
    items: SectionOrderUpdateInput[],
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Sections/Reorder/${eventId}`, {
      method: 'PUT',
      body: items,
    });
  },

  // ===== Tasks =====
  async getAllTasks(
    parameters: ChecklistTaskParameters,
  ): Promise<Pagination<ChecklistTask>> {
    return fetchWithPagination<ChecklistTask>($fetch, `${RESOURCE}/Tasks`, {
      query: parameters,
    });
  },

  async getTask(taskId: number | string): Promise<ChecklistTask> {
    return $fetch<ChecklistTask>(`${RESOURCE}/Tasks/Get/${taskId}`);
  },

  async createTask(
    input: Omit<ChecklistTaskInput, 'order'>,
    currentCount: number,
  ) {
    const body = { ...input, order: currentCount + 1 }; // define a ordem por defeito
    return await $fetch(`${RESOURCE}/Tasks/Create`, {
      method: 'POST',
      body,
    });
  },

  async updateTask(
    taskId: number,
    updatedTask: ChecklistTaskInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Tasks/Update/${taskId}`, {
      method: 'put',
      body: updatedTask,
    });
  },

  async toggleTaskComplete(taskId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Tasks/ToggleComplete/${taskId}`, {
      method: 'put',
    });
  },

  async removeTask(taskId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Tasks/Remove/${taskId}`, {
      method: 'delete',
    });
  },

  async reorderTasks(
    sectionId: number,
    items: { id: number; order: number }[],
  ): Promise<unknown> {
    return await $fetch<unknown>(`${RESOURCE}/Tasks/Reorder/${sectionId}`, {
      method: 'PUT',
      body: items,
    });
  },

  // ===== Templates =====
  async getCurrentTemplateForEventType(
    eventTypeId: number,
    partnerId?: number,
  ): Promise<ChecklistTemplateDetail> {
    return $fetch<ChecklistTemplateDetail>(
      `${RESOURCE}/Templates/Current/${eventTypeId}`,
      {
        query: partnerId ? { partnerId } : undefined,
      },
    );
  },
  async getTemplates(
    eventTypeId: number,
    includeGlobalFallback = true,
  ): Promise<ChecklistTemplate[]> {
    return $fetch<ChecklistTemplate[]>(`${RESOURCE}/Templates/${eventTypeId}`, {
      query: { includeGlobalFallback },
    });
  },

  async getTemplate(templateId: number): Promise<ChecklistTemplateDetail> {
    return $fetch<ChecklistTemplateDetail>(
      `${RESOURCE}/Templates/Get/${templateId}`,
    );
  },

  async updateTemplate(
    templateId: number,
    input: ChecklistTemplateUpdateInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/${templateId}`, {
      method: 'put',
      body: input,
    });
  },

  async cloneTemplateToPartner(
    templateId: number,
    partnerId: number,
  ): Promise<ChecklistTemplateDetail> {
    return $fetch<ChecklistTemplateDetail>(
      `${RESOURCE}/Templates/CloneToPartner/${templateId}`,
      {
        method: 'post',
        query: { partnerId },
      },
    );
  },

  async bootstrapPartnerTemplates(partnerId: number): Promise<unknown> {
    return $fetch<unknown>(
      `${RESOURCE}/Templates/BootstrapPartner/${partnerId}`,
      {
        method: 'post',
      },
    );
  },

  async setDefaultTemplate(templateId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/SetDefault/${templateId}`, {
      method: 'post',
    });
  },

  // ===== Template Sections =====
  async addTemplateSection(
    templateId: number,
    input: ChecklistTemplateSectionInput,
  ): Promise<ChecklistTemplateSection> {
    return $fetch<ChecklistTemplateSection>(
      `${RESOURCE}/Templates/${templateId}/Sections`,
      {
        method: 'post',
        body: input,
      },
    );
  },

  async updateTemplateSection(
    sectionId: number,
    input: ChecklistTemplateSectionUpdateInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/Sections/${sectionId}`, {
      method: 'put',
      body: input,
    });
  },

  async deleteTemplateSection(sectionId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/Sections/${sectionId}`, {
      method: 'delete',
    });
  },

  async reorderTemplateSections(
    templateId: number,
    items: TemplateSectionOrderUpdateInput[],
  ): Promise<unknown> {
    return $fetch<unknown>(
      `${RESOURCE}/Templates/Sections/Reorder/${templateId}`,
      {
        method: 'put',
        body: items,
      },
    );
  },

  // ===== Template Tasks =====
  async addTemplateTask(
    sectionId: number,
    input: ChecklistTemplateTaskInput,
  ): Promise<ChecklistTemplateTask> {
    // se não passares order, o backend mete no fim
    return $fetch<ChecklistTemplateTask>(
      `${RESOURCE}/Templates/Sections/${sectionId}/Tasks`,
      {
        method: 'post',
        body: input,
      },
    );
  },

  async updateTemplateTask(
    taskId: number,
    input: ChecklistTemplateTaskUpdateInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/Tasks/${taskId}`, {
      method: 'put',
      body: input,
    });
  },

  async deleteTemplateTask(taskId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/Tasks/${taskId}`, {
      method: 'delete',
    });
  },

  async reorderTemplateTasks(
    sectionId: number,
    items: TemplateTaskOrderUpdateInput[],
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Templates/Tasks/Reorder/${sectionId}`, {
      method: 'put',
      body: items,
    });
  },
});
