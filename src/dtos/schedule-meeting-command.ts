export enum MeetingType {
  adHoc,
  schedule,
}

export enum UserSessionWebRtcConnectionStatus {
  connecting,
  connected,
  disconnected,
}

export enum UserSessionWebRtcConnectionType {
  send,
  receive,
}

export enum UserSessionWebRtcConnectionMediaType {
  audio,
  video,
  screen,
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

export interface UpdateUserSessionWebRtcConnectionStatusCommand {
  userSessionWebRtcConnectionId: string;
  connectionStatus: UserSessionWebRtcConnectionStatus;
}

export interface RemoveUserSessionWebRtcConnectionCommand {
  webRtcPeerConnectionId: string;
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

export interface UserSessionWebRtcConnection {
  id: string;
  userSessionId: string;
  webRtcPeerConnectionId: string;
  receiveWebRtcConnectionId?: string;
  mediaType: UserSessionWebRtcConnectionMediaType;
  connectionType: UserSessionWebRtcConnectionType;
  connectionStatus: UserSessionWebRtcConnectionStatus;
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
  webRtcConnections: UserSessionWebRtcConnection[];
}

export interface IUserSessionMediaStream {
  userSessionId: string;
  connectionId: string;
  stream: MediaStream;
}

export interface IUserSessionConnectionManager {
  peerConnections: IUserRTCPeerConnection[];
}

export interface IUserRTCPeerConnection {
  userSessionId: string;
  peerConnectionId: string;
  peerConnection: RTCPeerConnection;
  relatedPeerConnectionId?: string;
  type: IUserRTCPeerConnectionType;
  mediaType: UserSessionWebRtcConnectionMediaType;
}

export enum IUserRTCPeerConnectionType {
  offer,
  answer,
}
