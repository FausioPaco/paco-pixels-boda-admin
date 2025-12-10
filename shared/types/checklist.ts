export interface ChecklistSection {
  id: number;
  title: string;
  description: string;
  eventId?: number;
  eventName?: string;
  order: number;
  tasks?: ChecklistTask[];
}

export interface ChecklistTask {
  id: number;
  title: string;
  notes: string;
  due_Date?: string;
  has_Indefinite_Date: boolean;
  is_Completed: boolean;
  completed_At?: string;
  sectionId: number;
  eventId?: number;
  sectionTitle?: string;
  order: number;
}

export interface ChecklistSectionParameters {
  eventId?: number;
  searchQuery: string;
  startDate: string;
  endDate: string;
  pageNumber: number;
  pageSize: number;
}

export type ChecklistTaskStatus = '' | 'PENDING' | 'COMPLETED' | 'OVERDUE';

export const CHECKLIST_TASK_STATUS_DESCRIPTIONS = {
  '': 'Todos estados',
  PENDING: 'Pendente',
  COMPLETED: 'Completado',
  OVERDUE: 'Em atraso',
};

export interface ChecklistTaskParameters {
  eventId?: number;
  sectionId?: number;
  status: '' | 'PENDING' | 'COMPLETED' | 'OVERDUE';
  searchQuery: string;
  startDate?: string;
  endDate?: string;
  has_Indefinite_Date?: boolean;
  pageNumber: number;
  pageSize: number;
}

export interface ChecklistSectionInput {
  title: string;
  description?: string;
  eventId?: number;
  order: number;
}

export interface ChecklistTaskInput {
  title: string;
  notes?: string;
  due_Date?: Date | undefined | null;
  has_Indefinite_Date: boolean;
  sectionId: number;
  eventId?: number;
}

export interface ChecklistSectionOption {
  id: number;
  name: string;
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  description: string;
  eventTypeId: number;
  partnerId?: number | null;
  isDefault: boolean;
  isActive: boolean;
  created_At: string;
  modified_At: string;
}

export interface ChecklistTemplateDetail extends ChecklistTemplate {
  sections: ChecklistTemplateSection[];
}

export interface ChecklistTemplateSection {
  id: number;
  title: string;
  description: string;
  order: number;
  default_Offset_Days?: number | null;
  tasks: ChecklistTemplateTask[];
}

export interface ChecklistTemplateTask {
  id: number;
  title: string;
  notes: string;
  order: number;
  default_Offset_Days?: number | null;
  has_Indefinite_Date: boolean;
}

export interface ChecklistTemplateUpdateInput {
  name: string;
  description: string;
  isActive: boolean;
}

export interface ChecklistTemplateSectionInput {
  title: string;
  description?: string;
  order?: number;
  default_Offset_Days?: number | null;
}

export interface ChecklistTemplateSectionUpdateInput {
  title: string;
  description?: string;
  order: number;
  default_Offset_Days?: number | null;
}

export interface TemplateSectionOrderUpdateInput {
  id: number;
  order: number;
}

export interface ChecklistTemplateTaskInput {
  title: string;
  notes?: string;
  order?: number;
  default_Offset_Days?: number | null;
  has_Indefinite_Date: boolean;
}

export interface ChecklistTemplateTaskUpdateInput {
  title: string;
  notes?: string;
  order: number;
  default_Offset_Days?: number | null;
  has_Indefinite_Date: boolean;
}

export interface TemplateTaskOrderUpdateInput {
  id: number;
  order: number;
}

export interface SectionOrderUpdateInput {
  id: number;
  order: number;
}
