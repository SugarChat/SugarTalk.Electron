import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { googleAuthenticated, facebookAuthenticated } from './login-service';
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
  const [loading, setLoading] = useState<boolean>(false);
  const { dispatch } = useStores();

  const onHandleError = () => {
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

  const onLogin = async ({ loginType, onSuccess }: ILoginProps) => {
    try {
      window?.loadingOpen();
      switch (loginType) {
        case 'Google':
          await googleAuthenticated()
            .then((result) => {
              console.log(result);
              onSuccess();
            })
            .catch(() => {
              onHandleError();
            });
          break;
        case 'Facebook':
          await facebookAuthenticated()
            .then((result) => {
              console.log(result);
            })
            .catch(() => onHandleError());
          break;
        case 'Wechat':
          break;
        default:
          break;
      }
    } finally {
      window?.loadingClose();
    }
  };

  return {
    onLogin,
    loginPlatformList,
    loading,
  };
};
