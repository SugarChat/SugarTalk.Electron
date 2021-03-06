import axios, { AxiosInstance } from 'axios';
import * as types from './api.types';
import Env from '../../config/env';
import { loadRootStore } from '../../contexts/setup-store';

axios.defaults.headers = {
  'Content-Type': 'application/json',
};

export const api: AxiosInstance = axios.create({
  baseURL: Env.apiUrl,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (request) => {
    request.headers.Authorization = `Bearer ${
      loadRootStore()?.userStore?.idToken ?? ''
    }`;
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * login example
 */
export const loginRequest = async (
  username: string,
  password: string
): Promise<types.LoginResult> => {
  const response = await api.post('auth/login', { username, password });

  return {
    token: response.data.token,
  };
};
