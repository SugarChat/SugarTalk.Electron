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
  userSessionId: string;
  isMuted: boolean;
}

export interface ShareScreenCommand {
  userSessionId: string;
  isShared: boolean;
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
  userSessions: IUserSession[];
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
  stream: MediaStream;
}

export interface IUserSessionMediaStreamVolume {
  audioContext: AudioContext;
  userSessionId: string;
  volume: number;
  name: string;
}

export interface IUserSessionConnectionManager {
  peerConnections: IUserRTCPeerConnection[];
}

export interface IUserRTCPeerConnection {
  userSessionId: string;
  peerConnectionId: string;
  peerConnection: RTCPeerConnection;
  peerConnectionType: IUserRTCPeerConnectionType;
  peerConnectionMediaType: IUserRTCPeerConnectionMediaType;
  relatedPeerConnectionId?: string;
}

export enum IUserRTCPeerConnectionType {
  offer,
  answer,
}

export enum IUserRTCPeerConnectionMediaType {
  audio,
  video,
  screen,
}
