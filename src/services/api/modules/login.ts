import { SugarTalkResponse } from '../../../dtos/sugar-talk-response';
import { api } from '../base-api';
import { IUserInfo, IGoogleAccessToken } from '../../../screens/login/type';

export default {
  sign: async (): Promise<SugarTalkResponse<IUserInfo>> => {
    return (
      await api.request({
        url: `/user/signin`,
        method: `GET`,
      })
    ).data;
  },

  facebookSign: async (code: string) => {
    return (
      await api.post<SugarTalkResponse<any>>('/xxx/facebookSign', { code })
    ).data;
  },

  getGoogleToken: async (
    code: string,
    redirecturi: string
  ): Promise<SugarTalkResponse<IGoogleAccessToken>> => {
    return api.request({
      url: `/authentication/google/accessToken`,
      method: `GET`,
      params: {
        code,
        redirecturi,
      },
    });
  },
};
