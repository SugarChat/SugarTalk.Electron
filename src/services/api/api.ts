import axios, { AxiosInstance } from 'axios';
import * as types from './api.types';
import Env from '../../config/env';

axios.defaults.headers = {
  'Content-Type': 'application/json',
};

export const api: AxiosInstance = axios.create({
  baseURL: Env.apiUrl,
  headers: {
    Accept: 'application/json',
  },
});
api.interceptors.response.use(
  function (response) {
    // Sugartalk has a unified response
    return response.data;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
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
