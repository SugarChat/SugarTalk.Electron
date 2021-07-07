// import * as electron from 'electron';
import { useHistory } from 'react-router-dom';
import { getAuthenticatedClient } from './login-service';
import { useStores } from '../../contexts/root-context';

export type LoginType = 'google' | 'facebook' | 'wechat';

export const useLoginLogic = () => {
  const { dispatch } = useStores();
  const history = useHistory();
  const onLogin = (loginType: LoginType) => {
    getAuthenticatedClient()
      .then((result) => {
        dispatch({
          type: 'UpdateIdToken',
          payload: result?.credentials.id_token,
        });
        console.log(result?.credentials.id_token);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return {
    onLogin,
  };
};
