import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  export interface LoginResult {
    accessToken: string;
    admin?: {
      id: string;
      nickname?: string;
      roles: string[];
      username: string;
    };
    permissions?: string[];
    tokenType?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/admin/auth/login', data);
}

export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/admin/auth/refresh', {
    withCredentials: true,
  });
}

export async function logoutApi() {
  return baseRequestClient.post('/admin/auth/logout', {
    withCredentials: true,
  });
}

export async function getAccessCodesApi() {
  const me = await requestClient.get<{ permissions?: string[] }>('/admin/auth/me');
  return me.permissions ?? [];
}
