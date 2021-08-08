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
  userSessions: Record<string, IUserSession>;
}

export interface IUserSession {
  id: string;
  connectionId: string;
  userName: string;
  isSelf: boolean;
  userPicture: string;
  isSharingScreen: boolean;
  isSharingCamera: boolean;
  sendOnlyPeerConnection: RTCPeerConnection | undefined;
  recvOnlyPeerConnections: RTCPeerConnection[];
  sdp: string;
}
