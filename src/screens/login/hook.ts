// import * as electron from 'electron';
import { useState } from 'react';
import { getGoogleAuthenticatedClient } from './login-service';
import { useStores } from '../../contexts/root-context';

export type LoginType = 'Google' | 'Facebook' | 'Wechat';

export interface ILoginProps {
  loginType: LoginType;
  onSuccess: () => void;
  onError: (e: Error) => void;
}

export interface ILoginPlatform extends ILoginProps {
  imageSrc: string;
}

export const useLoginLogic = () => {
  const [hasLoginError, setLoginError] = useState<boolean>(false);
  const { dispatch } = useStores();

  const loginPlatformList: ILoginPlatform[] = [
    {
      loginType: 'Wechat',
      imageSrc: '../assets/login/wechat.png',
      onSuccess: () => {},
      onError: (e: Error) => {
        setLoginError(true);
      },
    },
    {
      loginType: 'Google',
      imageSrc: '../assets/login/google.png',
      onSuccess: () => {},
      onError: (e: Error) => {
        setLoginError(true);
      },
    },
    {
      loginType: 'Facebook',
      imageSrc: '../assets/login/facebook.png',
      onSuccess: () => {},
      onError: (e: Error) => {
        setLoginError(true);
      },
    },
  ];

  const onLogin = ({ loginType, onSuccess, onError }: ILoginProps) => {
    switch (loginType) {
      case 'Google':
        getGoogleAuthenticatedClient()
          .then((result) => {
            dispatch({
              type: 'UpdateIdToken',
              payload: result?.credentials.id_token,
            });
            onSuccess();
          })
          .catch((e) => {
            onError(e);
          });
        break;
      case 'Facebook':
        getGoogleAuthenticatedClient()
          .then((result) => {
            dispatch({
              type: 'UpdateIdToken',
              payload: result?.credentials.id_token,
            });
          })
          .catch((e) => {
            onError(e);
          });
        break;
      case 'Wechat':
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
