import {
  GetMeetingSessionRequest,
  MeetingDto,
  MeetingSession,
  ScheduleMeetingCommand,
  JoinMeetingCommand,
  ChangeAudioCommand,
  ShareScreenCommand,
  IUserSession,
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

  joinMeeting: async (
    request: JoinMeetingCommand
  ): Promise<SugarTalkResponse<MeetingSession>> => {
    const response = await api.post<SugarTalkResponse<MeetingSession>>(
      '/meeting/join',
      request
    );

    return response.data;
  },

  changeAudio: async (
    request: ChangeAudioCommand
  ): Promise<SugarTalkResponse<IUserSession>> => {
    const response = await api.post<SugarTalkResponse<IUserSession>>(
      '/userSession/audio/change',
      request
    );

    return response.data;
  },

  shareScreen: async (
    request: ShareScreenCommand
  ): Promise<SugarTalkResponse<IUserSession>> => {
    const response = await api.post<SugarTalkResponse<IUserSession>>(
      '/userSession/screen/share',
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

  getIceServers: async (): Promise<RTCIceServer[]> => {
    const response = await api.get<RTCIceServer[]>(`/meeting/iceservers`);
    return response.data;
  },
};
