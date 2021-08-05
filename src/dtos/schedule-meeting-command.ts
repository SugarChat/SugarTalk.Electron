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

export interface GetMeetingSessionRequest {
  meetingNumber: string;
}

export interface MeetingSession {
  meetingId: string;
  meetingNumber: string;
  meetingType: MeetingType;
  userSessions: Record<string, UserSession>;
}

export interface UserSession {
  id: string;
  userid: string;
  username: string;
  avatar: string;
  isSharingScreen: boolean;
  isSharingCamera: boolean;
}
