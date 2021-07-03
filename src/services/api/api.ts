import axios, { AxiosInstance } from 'axios';
import * as types from './api.types';
import Env from '../../config/env';

export const api: AxiosInstance = axios.create({
  baseURL: Env.apiUrl,
});

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
