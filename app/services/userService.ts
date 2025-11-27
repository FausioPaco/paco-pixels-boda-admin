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

  async uploadProfilePhoto(
    userId: number,
    file: File,
  ): Promise<UploadProfilePhotoResponse> {
    const formData = new FormData();
    formData.append('fileUpload', file);

    return $fetch<UploadProfilePhotoResponse>(
      `${RESOURCE}/UploadProfilePhoto/${userId}`,
      {
        method: 'post',
        body: formData,
      },
    );
  },

  async removeProfilePhoto(userId: number): Promise<unknown> {
    return await $fetch<unknown>(`${RESOURCE}/ProfilePhoto/${userId}`, {
      method: 'delete',
    });
  },

  async heartbeat(): Promise<unknown> {
    return await $fetch<unknown>(`${RESOURCE}/Heartbeat`, {
      method: 'post',
    });
  },

  async changeMyPassword(payload: {
    oldPassword: string;
    newPassword: string;
  }): Promise<unknown> {
    return await $fetch<unknown>(`${RESOURCE}/ChangeMyPassword`, {
      method: 'put',
      body: {
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      },
    });
  },

  async updateMyProfile(payload: { name: string }): Promise<User> {
    return await $fetch<User>(`${RESOURCE}/UpdateMyProfile`, {
      method: 'put',
      body: payload,
    });
  },
});
