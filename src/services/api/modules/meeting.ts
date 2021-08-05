import {
  GetMeetingSessionRequest,
  MeetingDto,
  MeetingSession,
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

  getMeetingSession: async (
    getMeetingSessionRequest: GetMeetingSessionRequest
  ): Promise<SugarTalkResponse<MeetingSession>> => {
    const response = await api.get<SugarTalkResponse<MeetingSession>>(
      `/meeting/session?meetingNumber=${getMeetingSessionRequest.meetingNumber}`
    );

    return response.data;
  },
};
