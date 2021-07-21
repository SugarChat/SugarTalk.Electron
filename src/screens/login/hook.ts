import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { googleAuthenticated, facebookAuthenticated } from './login-service';
import { useStores } from '../../contexts/root-context';
import Api from '../../services/api/modules/login';
import { IGoogleAccessToken, ILoginProps, ILoginPlatform } from './type';

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
      onSuccess: async () => {
        const { code, data } = await Api.sign();
        if (code === 20000) {
          dispatch({ type: 'UpdateUserInfo', payload: data });
        }
      },
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
            .then(({ idToken }) => {
              dispatch({ type: 'UpdateIdToken', payload: idToken });
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
