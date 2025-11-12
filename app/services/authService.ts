import type { NitroFetchRequest, $Fetch } from 'nitropack';

const RESOURCE = '/Auth';

export const getAuthService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async authenticate(credentials: UserLoginInput): Promise<AuthResponse> {
    return $fetch<AuthResponse>(`${RESOURCE}/Authenticate`, {
      method: 'post',
      body: credentials,
    });
  },
});
