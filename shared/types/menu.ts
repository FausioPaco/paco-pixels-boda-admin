export interface Menu {
  id: number;
  title: string;
  eventId: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  menuId: number;
  menuCategory: MenuCategory;
  order?: number;
}

export interface MenuCategory {
  id: number;
  title: string;
  icon: string;
}

export interface MenuInput {
  title: string;
  eventId: number;
}

export interface MenuItemInput {
  name: string;
  menuCategoryId: number;
}

export interface MenuResourceParameters {
  eventId?: number;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}
