import { MeetingDto } from '../../dtos/ScheduleMeetingCommand';
import { SugarTalkResponse } from '../../dtos/SugarTalkResponse';
import { api } from './api';

export const scheduleMeeting = async () => {
  return await api.post<SugarTalkResponse<MeetingDto>>('/meeting/schedule', {});
};
