import { MeetingDto } from '../../../dtos/schedule-meeting-command';
import { SugarTalkResponse } from '../../../dtos/sugar-talk-response';
import { api } from '../base-api';

export default {
  scheduleMeeting: async (onError: (error: Error) => void) => {
    return api
      .post<SugarTalkResponse<MeetingDto>>('/meeting/schedule', {})
      .catch((e) => onError(e));
  },
};
