import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Users';

export const getUserService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllUsers(params: UserParameters): Promise<Pagination<User>> {
    return fetchWithPagination<User>($fetch, RESOURCE, {
      query: params,
    });
  },

  async getUser(userId: number): Promise<User> {
    return $fetch<User>(`${RESOURCE}/Get/${userId}`);
  },

  async createUser(newUser: UserInput): Promise<User> {
    return $fetch<User>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newUser,
    });
  },

  async updateUser(userId: number, updatedUser: UserInput): Promise<void> {
    return $fetch(`${RESOURCE}/Update/${userId}`, {
      method: 'put',
      body: updatedUser,
    });
  },

  async removeUser(userId: number): Promise<void> {
    return $fetch(`${RESOURCE}/Remove/${userId}`, {
      method: 'delete',
    });
  },

  async getRoles(): Promise<Role[]> {
    return $fetch<Role[]>(`${RESOURCE}/GetRoles`);
  },

  async resetPassword(
    userId: number,
    newPassword: PasswordInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/ResetPassword/${userId}`, {
      method: 'put',
      body: newPassword,
    });
  },
});
