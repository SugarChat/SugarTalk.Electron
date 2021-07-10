import {
  MeetingDto,
  ScheduleMeetingCommand,
} from '../../../dtos/schedule-meeting-command';
import { SugarTalkResponse } from '../../../dtos/sugar-talk-response';
import { api } from '../base-api';

export default {
  scheduleMeeting: async (
    request: ScheduleMeetingCommand
  ): Promise<SugarTalkResponse<MeetingDto>> => {
    const response = await api.post<SugarTalkResponse<MeetingDto>>(
      '/meeting/schedule',
      request
    );

    return response.data;
  },
};
