import { SugarTalkResponse } from '../../../dtos/sugar-talk-response';
import { api } from '../base-api';

export default {
  googleSign: async (code: string) => {
    return (await api.post<SugarTalkResponse<any>>('/xxx/googleSign', { code }))
      .data;
  },
  facebookSign: async (code: string) => {
    return (
      await api.post<SugarTalkResponse<any>>('/xxx/facebookSign', { code })
    ).data;
  },
};
