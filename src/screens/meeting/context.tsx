import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import electron from 'electron';
import { useInterval } from 'ahooks';
import Env from '../../config/env';
import { useStores } from '../../contexts/root-context';
import {
  getMediaDeviceAccessAndStatus,
  showRequestMediaAccessDialog,
} from '../../utils/media';
import {
  JoinMeetingCommand,
  IUserSession,
  IUserSessionConnectionManager,
  IUserSessionMediaStream,
  ChangeAudioCommand,
  UserSessionWebRtcConnectionStatus,
  IUserRTCPeerConnection,
  GetMeetingSessionRequest,
  UpdateUserSessionWebRtcConnectionStatusCommand,
  UserSessionWebRtcConnectionType,
  ShareScreenCommand,
  UserSessionWebRtcConnectionMediaType,
  RemoveUserSessionWebRtcConnectionCommand,
  UserSessionWebRtcConnection,
} from '../../dtos/schedule-meeting-command';
import api from '../../services/api';
import { GUID } from '../../utils/guid';

export interface IMeetingQueryStringParams {
  meetingId: string;
  userName: string;
  connectedWithAudio: boolean;
  connectedWithVideo: boolean;
}

interface IMeetingContext {
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  currentScreenId: string;
  setCurrentScreenId: React.Dispatch<React.SetStateAction<string>>;
  isSharingVideo: boolean;
  setIsSharingVideo: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectingScreen: boolean;
  setIsSelectingScreen: React.Dispatch<React.SetStateAction<boolean>>;
  serverConnection:
    | React.MutableRefObject<HubConnection | undefined>
    | undefined;
  meetingNumber: string;
  userSessions: IUserSession[];
  userSessionAudios: IUserSessionMediaStream[];
  userSessionVideos: IUserSessionMediaStream[];
}

export const MeetingContext = React.createContext<IMeetingContext>({
  isMuted: false,
  setIsMuted: () => {},
  currentScreenId: '',
  setCurrentScreenId: () => {},
  isSharingVideo: false,
  setIsSharingVideo: () => {},
  isSelectingScreen: false,
  setIsSelectingScreen: () => {},
  serverConnection: undefined,
  meetingNumber: '',
  userSessions: [],
  userSessionAudios: [],
  userSessionVideos: [],
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [isSharingVideo, setIsSharingVideo] = React.useState<boolean>(false);
  const [currentScreenId, setCurrentScreenId] = React.useState<string>('');
  const [isSelectingScreen, setIsSelectingScreen] =
    React.useState<boolean>(false);
  const [meetingJoined, setMeetingJoined] = React.useState<boolean>(false);
  const [localUserAdded, setLocalUserAdded] = React.useState<boolean>(false);
  const [otherUsersAdded, setOtherUsersAdded] = React.useState<boolean>(false);
  const [signalrConnected, setSignalrConnected] =
    React.useState<boolean>(false);
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);
  const [userSessionAudios, setUserSessionAudios] = React.useState<
    IUserSessionMediaStream[]
  >([]);

  const [userSessionVideos, setUserSessionVideos] = React.useState<
    IUserSessionMediaStream[]
  >([]);

  const [meetingNumber, setMeetingNumber] = React.useState<string>('');
  const [meetingParam, setMeetingParam] =
    React.useState<IMeetingQueryStringParams>();
  const mediaStream = React.useRef<MediaStream>();
  const [mediaStreamInitialized, setMediaStreamInitialized] =
    React.useState<boolean>(false);
  const serverConnection = React.useRef<HubConnection>();
  const userSessionConnectionManager =
    React.useRef<IUserSessionConnectionManager>({ peerConnections: [] });

  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    const params = queryString.parse(location.search, {
      parseBooleans: true,
    }) as unknown as IMeetingQueryStringParams;
    setMeetingParam(params);
    setMeetingNumber(params.meetingId);
  }, [location.search]);

  React.useEffect(() => {
    if (meetingParam) {
      const initMediaDeviceStatus = async () => {
        const hasMicrophone = await getMediaDeviceAccessAndStatus('microphone');
        if (hasMicrophone === false) {
          showRequestMediaAccessDialog();
          electron.remote.getCurrentWindow().close();
        }
      };
      const initMediaStream = async () => {
        mediaStream.current = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setMediaStreamInitialized(true);
      };

      initMediaDeviceStatus();
      initMediaStream();

      setIsMuted(!meetingParam.connectedWithAudio);

      const joinTheMeeting = async () => {
        const joinMeetingCommand: JoinMeetingCommand = {
          meetingNumber: meetingParam.meetingId,
          isMuted: !meetingParam.connectedWithAudio,
        };
        await api.meeting.joinMeeting(joinMeetingCommand).then(() => {
          setMeetingJoined(true);
        });
      };

      joinTheMeeting();
    }
  }, [meetingParam]);

  React.useEffect(() => {
    if (meetingJoined && meetingParam) {
      connectSignalr(meetingParam.userName, meetingParam.meetingId);
    }
  }, [meetingJoined]);

  React.useEffect(() => {
    if (signalrConnected) {
      setupSignalr();
    }
  }, [signalrConnected]);

  React.useEffect(() => {
    if (localUserAdded) {
      const selfUserSession = userSessions.find((x) => x.isSelf);
      if (selfUserSession) {
        createPeerConnection(
          selfUserSession,
          mediaStream.current,
          UserSessionWebRtcConnectionMediaType.audio
        );
      }
    }
  }, [localUserAdded]);

  React.useEffect(() => {
    if (otherUsersAdded) {
      connectToOtherUsersIfRequire(userSessions.filter((x) => !x.isSelf));
    }
  }, [otherUsersAdded]);

  useInterval(() => {
    syncMeeting();
  }, 2500);

  React.useEffect(() => {
    if (mediaStreamInitialized && mediaStream.current) {
      mediaStream.current.getAudioTracks()[0].enabled = !isMuted;
      const selfUserSession = userSessions.find((x) => x.isSelf);
      if (selfUserSession) {
        selfUserSession.isMuted = isMuted;
        updateUserSession(selfUserSession);
        changeAudio(selfUserSession.id, isMuted);
      }
    }
  }, [isMuted, mediaStreamInitialized]);

  React.useEffect(() => {
    const selfUserSession = userSessions.find((x) => x.isSelf);
    if (selfUserSession) {
      const shareScreen = async (shareScreenCommand: ShareScreenCommand) => {
        const response = await api.meeting.shareScreen(shareScreenCommand);
        updateUserSession(response.data);
      };
      const removeScreenConnection = async () => {
        const screenPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) =>
              x.isSelf &&
              x.mediaType === UserSessionWebRtcConnectionMediaType.screen
          );
        if (screenPeerConnection) {
          const removeConnectionCommand: RemoveUserSessionWebRtcConnectionCommand =
            {
              webRtcPeerConnectionId: screenPeerConnection.peerConnectionId,
            };
          await api.meeting.removeUserSessionWebRtcConnection(
            removeConnectionCommand
          );
          closeAndRemoveConnection(screenPeerConnection);
        }
      };
      const shareScreenCommand: ShareScreenCommand = {
        userSessionId: selfUserSession.id,
        isShared: true,
      };
      if (!currentScreenId && selfUserSession.isSharingScreen) {
        shareScreenCommand.isShared = false;
        shareScreen(shareScreenCommand);
        removeScreenConnection();
      } else {
        const videoConstraints: any = {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: currentScreenId,
          },
          optional: [{ minFrameRate: 120 }, { aspectRatio: 16 / 9 }],
        };
        navigator.mediaDevices
          .getUserMedia({
            video: videoConstraints,
            audio: false,
          })
          .then(async (screenStream) => {
            screenStream.getVideoTracks().forEach((x) => {
              x.contentHint = 'detail';
              x.applyConstraints({
                width: { min: 640, ideal: 1920, max: 1920 },
                height: { min: 400, ideal: 1080 },
                frameRate: { min: 120, ideal: 120, max: 120 },
              });
            });
            shareScreenCommand.isShared = true;
            shareScreen(shareScreenCommand);
            createPeerConnection(
              selfUserSession,
              screenStream,
              UserSessionWebRtcConnectionMediaType.screen
            );
          });
      }
    }
  }, [currentScreenId]);

  const syncMeeting = () => {
    const getMeetingSessionRequest: GetMeetingSessionRequest = {
      meetingNumber,
    };
    api.meeting.getMeetingSession(getMeetingSessionRequest).then((response) => {
      const connectionId = serverConnection.current?.connectionId;
      const newUserSessions = response.data.userSessions.map((userSession) => {
        userSession.isSelf = userSession.connectionId === connectionId;
        return userSession;
      });
      if (JSON.stringify(userSessions) !== JSON.stringify(newUserSessions)) {
        setUserSessions(newUserSessions);
      }
      connectToOtherUsersIfRequire(newUserSessions.filter((x) => !x.isSelf));
    });
  };

  const connectToOtherUserIfRequire = (otherUser: IUserSession) => {
    otherUser.webRtcConnections
      ?.filter((x) => x.connectionType === UserSessionWebRtcConnectionType.send)
      .forEach((connection) => {
        if (
          connection.connectionStatus ===
          UserSessionWebRtcConnectionStatus.connected
        ) {
          const hasConnection =
            userSessionConnectionManager.current.peerConnections.some(
              (x) =>
                x.userSessionId === otherUser.id &&
                x.receiveWebRtcConnectionId === connection.id
            );
          if (!hasConnection) {
            createPeerConnection(
              otherUser,
              undefined,
              connection.mediaType,
              connection.id
            );
          }
        }
      });
  };

  const connectToOtherUsersIfRequire = (otherUsers: IUserSession[]) => {
    otherUsers.map((otherUser) => {
      connectToOtherUserIfRequire(otherUser);
      return otherUser;
    });
  };

  const closeAndRemoveConnection = (connection: IUserRTCPeerConnection) => {
    if (connection) {
      connection.peerConnection.close();
      userSessionConnectionManager.current.peerConnections =
        userSessionConnectionManager.current.peerConnections.filter(
          (x) => x.peerConnectionId !== connection.peerConnectionId
        );
    }
  };

  const closeAndRemoveConnectionsFromUserSession = (
    userSession: IUserSession
  ) => {
    userSessionConnectionManager.current.peerConnections =
      userSessionConnectionManager.current.peerConnections
        .map((connection) => {
          if (connection.userSessionId === userSession.id) {
            connection.peerConnection.close();
            return undefined;
          }
          return connection;
        })
        .filter((x) => x !== undefined) as IUserRTCPeerConnection[];
  };

  const removeAudiosAndVideosFromUserSession = (userSession: IUserSession) => {
    setUserSessionAudios((oldUserSessionAudios: IUserSessionMediaStream[]) =>
      oldUserSessionAudios.filter(
        (oldUserSessionAudio: IUserSessionMediaStream) =>
          oldUserSessionAudio.userSessionId !== userSession.id
      )
    );
    setUserSessionVideos((oldUserSessionVideos: IUserSessionMediaStream[]) =>
      oldUserSessionVideos.filter(
        (oldUserSessionVideo: IUserSessionMediaStream) =>
          oldUserSessionVideo.userSessionId !== userSession.id
      )
    );
  };

  const updateUserSession = (userSession: IUserSession) => {
    setUserSessions((oldUserSessions: IUserSession[]) => {
      const updateUserSessions = oldUserSessions.map((oldUserSession) => {
        if (oldUserSession.id === userSession.id) {
          userSession.isSelf = oldUserSession.isSelf;
          return userSession;
        }
        return oldUserSession;
      });
      return [...updateUserSessions];
    });
  };

  const removeUserSession = (userSession: IUserSession) => {
    setUserSessions((oldUserSessions: IUserSession[]) =>
      oldUserSessions.filter(
        (oldUserSession: IUserSession) =>
          oldUserSession.connectionId !== userSession.connectionId
      )
    );
    removeAudiosAndVideosFromUserSession(userSession);
    closeAndRemoveConnectionsFromUserSession(userSession);
  };

  const changeAudio = (userSessionId: string, muted: boolean) => {
    const changeAudioCommand: ChangeAudioCommand = {
      userSessionId,
      isMuted: muted,
    };
    api.meeting.changeAudio(changeAudioCommand);
  };

  const connectSignalr = (userName: string, meetingId: string) => {
    const wsUrl = `${Env.apiUrl}meetingHub?username=${userName}&meetingNumber=${meetingId}`;
    serverConnection.current = new HubConnectionBuilder()
      .withUrl(wsUrl, { accessTokenFactory: () => userStore.idToken })
      .build();
    serverConnection.current
      ?.start()
      .then(() => {
        setSignalrConnected(true);
      })
      .catch((err?: any) => {
        if (err?.statusCode === 401) {
          alert('Unauthorized.');
          electron.remote.getCurrentWindow().close();
        }
      });
  };

  const setupSignalr = () => {
    serverConnection.current?.on('SetLocalUser', (localUser: IUserSession) => {
      localUser.isSelf = true;
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        localUser,
      ]);
      setLocalUserAdded(true);
    });

    serverConnection.current?.on(
      'SetOtherUsers',
      (otherUsers: IUserSession[]) => {
        otherUsers.forEach((user, index, array) => {
          user.isSelf = false;
          array[index] = user;
        });
        setUserSessions((oldUserSessions: IUserSession[]) => [
          ...oldUserSessions,
          ...otherUsers,
        ]);
        setOtherUsersAdded(true);
      }
    );

    serverConnection?.current?.on('OtherJoined', (otherUser: IUserSession) => {
      otherUser.isSelf = false;
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        otherUser,
      ]);
    });

    serverConnection?.current?.on('OtherLeft', (otherUser: IUserSession) => {
      removeUserSession(otherUser);
    });

    serverConnection?.current?.on(
      'OtherUserSessionWebRtcConnectionStatusUpdated',
      (otherUser: IUserSession) => {
        updateUserSession(otherUser);
        connectToOtherUserIfRequire(otherUser);
      }
    );

    serverConnection?.current?.on(
      'OtherUserSessionWebRtcConnectionRemoved',
      (removedConnection: UserSessionWebRtcConnection) => {
        const receiveConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) => x.receiveWebRtcConnectionId === removedConnection.id
          );
        if (receiveConnection) closeAndRemoveConnection(receiveConnection);
      }
    );

    serverConnection.current?.on(
      'OtherAudioChanged',
      (otherUser: IUserSession) => {
        updateUserSession(otherUser);
      }
    );

    serverConnection.current?.on(
      'OtherScreenShared',
      (otherUser: IUserSession) => {
        updateUserSession(otherUser);
      }
    );

    serverConnection?.current?.on(
      'ProcessAnswer',
      async (
        webRtcConnectionId,
        peerConnectionId: string,
        answerSDP: string
      ) => {
        const matchedPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) => x.peerConnectionId === peerConnectionId
          );
        if (matchedPeerConnection) {
          matchedPeerConnection.peerConnection.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
          );
          const updateConnectionStatusCommand: UpdateUserSessionWebRtcConnectionStatusCommand =
            {
              userSessionWebRtcConnectionId: webRtcConnectionId,
              connectionStatus: UserSessionWebRtcConnectionStatus.connected,
            };
          await api.meeting.updateUserSessionWebRtcConnectionStatus(
            updateConnectionStatusCommand
          );
        }
      }
    );

    serverConnection?.current?.on(
      'AddCandidate',
      (peerConnectionId: string, candidate: string) => {
        const objCandidate = JSON.parse(candidate);
        const matchedPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) => x.peerConnectionId === peerConnectionId
          );
        matchedPeerConnection?.peerConnection.addIceCandidate(objCandidate);
      }
    );

    serverConnection.current?.onclose((error?: Error) => {
      if (error?.message.includes('MeetingNotFoundException')) {
        alert('Meeting not found.');
        electron.remote.getCurrentWindow().close();
      }
    });
  };

  const createPeerConnection = async (
    userSession: IUserSession,
    streamToSend: MediaStream | undefined,
    mediaType: UserSessionWebRtcConnectionMediaType,
    receiveWebRtcConnectionId?: string
  ) => {
    const peerConnectionId = GUID();
    const peer = new RTCPeerConnection();

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.id,
        peerConnectionId,
        candidate,
        mediaType,
        receiveWebRtcConnectionId
      );
    });
    peer.addEventListener('track', (e: RTCTrackEvent) => {
      const stream = e.streams[0];
      if (e.track.kind === 'audio') {
        setUserSessionAudios(
          (oldUserSessionAudios: IUserSessionMediaStream[]) => {
            return [
              ...oldUserSessionAudios,
              {
                userSessionId: userSession.id,
                connectionId: userSession.connectionId,
                stream,
              },
            ];
          }
        );
      } else if (e.track.kind === 'video') {
        setUserSessionVideos(() => [
          {
            userSessionId: userSession.id,
            connectionId: userSession.connectionId,
            stream,
          },
        ]);
      }
    });

    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => {
        peer.addTrack(track, streamToSend);
      });
    }

    const offer = await peer.createOffer({
      offerToReceiveAudio: !userSession.isSelf,
      offerToReceiveVideo: !userSession.isSelf,
    });

    await peer.setLocalDescription(offer);

    const peerConnection: IUserRTCPeerConnection = {
      isSelf: userSession.isSelf,
      userSessionId: userSession.id,
      peerConnectionId,
      peerConnection: peer,
      receiveWebRtcConnectionId,
      mediaType,
    };

    userSessionConnectionManager.current.peerConnections.push(peerConnection);

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      userSession.id,
      peerConnectionId,
      offer.sdp,
      mediaType,
      receiveWebRtcConnectionId
    );
  };

  return (
    <MeetingContext.Provider
      value={{
        isMuted,
        setIsMuted,
        serverConnection,
        meetingNumber,
        userSessions,
        userSessionAudios,
        isSharingVideo,
        setIsSharingVideo,
        currentScreenId,
        setCurrentScreenId,
        isSelectingScreen,
        setIsSelectingScreen,
        userSessionVideos,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
