import { SugarTalkResponse } from '../../../dtos/sugar-talk-response';
import { api } from '../base-api';

export default {
  googleSign: async (code: string) => {
    return api.post<SugarTalkResponse<any>>('/xxx/googleSign', { code });
  },
};
