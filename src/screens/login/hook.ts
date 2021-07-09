// import * as electron from 'electron';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  googleAuthenticated,
  facebookAuthenticated,
  wechatAuthenticated,
} from './login-service';
import { useStores } from '../../contexts/root-context';

export type LoginType = 'Google' | 'Facebook' | 'Wechat';

export interface ILoginProps {
  loginType: LoginType;
  onSuccess: () => void;
}

export interface ILoginPlatform extends ILoginProps {
  imageSrc: string;
}

export const useLoginLogic = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [hasLoginError, setLoginError] = useState<boolean>(false);
  const { dispatch } = useStores();

  const onHandleError = () => {
    setLoginError(true);
    enqueueSnackbar('Login fail', {
      variant: 'error',
      autoHideDuration: 6000,
    });
  };

  const loginPlatformList: ILoginPlatform[] = [
    {
      loginType: 'Wechat',
      imageSrc: '../assets/login/wechat.png',
      onSuccess: () => {},
    },
    {
      loginType: 'Google',
      imageSrc: '../assets/login/google.png',
      onSuccess: () => {},
    },
    {
      loginType: 'Facebook',
      imageSrc: '../assets/login/facebook.png',
      onSuccess: () => {},
    },
  ];

  const onLogin = ({ loginType, onSuccess }: ILoginProps) => {
    switch (loginType) {
      case 'Google':
        googleAuthenticated()
          .then((result) => {
            dispatch({
              type: 'UpdateIdToken',
              payload: result?.credentials.id_token,
            });
            onSuccess();
          })
          .catch(() => {
            onHandleError();
          });
        break;
      case 'Facebook':
        facebookAuthenticated()
          .then(({ accessToken }) => {
            console.log(accessToken);
          })
          .catch(() => onHandleError());
        break;
      case 'Wechat':
        wechatAuthenticated()
          .then(({ accessToken, openId }) => {
            console.log(`access token: ${accessToken}, openid: ${openId}`);
          })
          .catch(() => onHandleError());
        break;
      default:
        break;
    }
  };

  return {
    onLogin,
    loginPlatformList,
    hasLoginError,
  };
};
