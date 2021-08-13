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
  isMuted: boolean;
}

export interface ChangeAudioCommand {
  UserSessionId: string;
  isMuted: boolean;
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
  isMuted: boolean;
  isSharingScreen: boolean;
  isSharingCamera: boolean;
}

export interface IUserSessionMediaStream {
  userSessionId: string;
  connectionId: string;
  stream: MediaStream;
}

export interface IUserSessionConnectionManager {
  isSelf: boolean;
  userSessionId: string;
  connectionId: string;
  peerConnections: IUserRTCPeerConnection[];
}

export interface IUserRTCPeerConnection {
  peerConnection: IRTCPeerConnectionWrapper;
}

export interface IRTCPeerConnectionWrapper {
  id: string;
  connection: RTCPeerConnection;
}
