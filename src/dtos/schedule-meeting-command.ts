import { Guid } from 'guid-typescript';

export enum MeetingType {
  adHoc,
  schedule,
}

export interface ScheduleMeetingCommand {
  id: string;
  meetingType: MeetingType;
}

export interface JoinMeetingCommand {
  meetingNumber: string;
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
  allUserSessions: IUserSession[];
}

export interface IUserSession {
  id: string;
  connectionId: string;
  userName: string;
  isSelf: boolean;
  userPicture: string;
  isSharingScreen: boolean;
  isSharingCamera: boolean;
}

export interface IUserSessionAudio {
  userSessionId: string;
  connectionId: string;
  audioStream: MediaStream | null;
}

export interface IUserSessionConnection {
  userSessionId: string;
  connectionId: string;
  sendOnlyPeerConnection: RTCPeerConnection | undefined;
  recvOnlyPeerConnections: IUserRTCPeerConnection[];
}

export interface IUserRTCPeerConnection {
  connectionId: string;
  peerConnection: RTCPeerConnection;
}
