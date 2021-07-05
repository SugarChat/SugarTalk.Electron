// import * as electron from 'electron';
import { getAuthenticatedClient } from './login-server';

export type LoginType = 'google' | 'facebook' | 'wechat';

export const useLoginLogic = () => {
  const onLogin = (loginType: LoginType) => {
    getAuthenticatedClient()
      .then((result) => {
        console.log(result?.credentials?.id_token);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return {
    onLogin,
  };
};
