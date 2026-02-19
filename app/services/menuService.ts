import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Menu';

export const getMenuService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllMenus(
    parameters: MenuResourceParameters,
  ): Promise<Pagination<Menu>> {
    return fetchWithPagination<Menu>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async getMenuByEvent(eventId: number): Promise<Menu> {
    return $fetch<Menu>(`${RESOURCE}/GetByEvent/${eventId}`);
  },

  async getMenusByEvent(eventId: number): Promise<Menu[]> {
    return $fetch<Menu[]>(`${RESOURCE}/GetMenusByEvent/${eventId}`);
  },

  async getMenuCategories(): Promise<MenuCategory[]> {
    return $fetch<MenuCategory[]>(`${RESOURCE}/Categories`);
  },

  async createMenu(newMenu: MenuInput): Promise<Menu> {
    return $fetch<Menu>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newMenu,
    });
  },

  async addMenuItem(menuId: number, item: MenuItemInput): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/AddItem/${menuId}`, {
      method: 'post',
      body: item,
    });
  },

  async updateMenuItem(id: number, item: MenuItemInput): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/UpdateItem/${id}`, {
      method: 'put',
      body: item,
    });
  },

  async removeMenu(menuId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Remove/${menuId}`, {
      method: 'delete',
    });
  },

  async removeMenuItem(menuItemId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/RemoveItem/${menuItemId}`, {
      method: 'delete',
    });
  },
});
