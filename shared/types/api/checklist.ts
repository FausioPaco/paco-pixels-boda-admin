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
  OVERDUE: 'Atrasado',
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
