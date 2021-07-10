import { Guid } from 'guid-typescript';

export enum MeetingType {
  adHoc,
  schedule,
}

export interface ScheduleMeetingCommand {
  id: string;
  meetingType: MeetingType;
}

export interface MeetingDto {
  meetingNumber: string;
}
