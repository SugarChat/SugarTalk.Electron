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
  UpdateStatusCommand,
  UserSessionConnectionStatus,
  IUserRTCPeerConnection,
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
          selfUserSession.isSelf,
          undefined
        );
      }
    }
  }, [localUserAdded]);

  React.useEffect(() => {
    userSessions
      .filter((x) => !x.isSelf)
      .map((userSession) => {
        const hasConnection =
          userSessionConnectionManager.current.peerConnections.some(
            (x) => x.userSessionId === userSession.id
          );
        if (
          userSession.connectionStatus ===
            UserSessionConnectionStatus.connected &&
          !hasConnection
        ) {
          createPeerConnection(userSession, userSession.isSelf, undefined);
        }
        return userSession;
      });
  }, [userSessions]);

  useInterval(() => {}, 1000);

  React.useEffect(() => {
    if (mediaStreamInitialized && mediaStream.current) {
      mediaStream.current.getAudioTracks()[0].enabled = !isMuted;
      const selfUserSession = userSessions.find((x) => x.isSelf);
      if (selfUserSession) {
        selfUserSession.isMuted = isMuted;
        setUserSessions([...userSessions]);
        changeAudio(selfUserSession.id, isMuted);
      }
    }
  }, [isMuted, mediaStreamInitialized]);

  React.useEffect(() => {
    const currentUser = userSessions.find((x) => x.isSelf);
    if (currentUser) {
      const userSession: IUserSession = {
        ...currentUser,
        isSharingScreen: !!currentScreenId,
      };
      if (currentScreenId) {
        const videoConstraints: any = {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: currentScreenId,
          },
          optional: [{ minFrameRate: 30 }, { aspectRatio: 16 / 9 }],
        };
        navigator.mediaDevices
          .getUserMedia({
            video: videoConstraints,
            audio: false,
          })
          .then(async (screenStream) => {
            screenStream.getVideoTracks().forEach((x) =>
              x.applyConstraints({
                width: { exact: 1280 },
                height: { max: 1080 },
                frameRate: { min: 30, ideal: 45, max: 45 },
              })
            );
            if (currentUser) {
              await recreateConnectionForShareScreen(userSession, screenStream);
            }
          });
      } else if (currentUser)
        recreateConnectionForShareScreen(userSession, undefined);
    }
  }, [currentScreenId]);

  const recreateConnectionForShareScreen = async (
    userSession: IUserSession,
    screenStream: MediaStream | undefined
  ) => {
    await createPeerConnection(userSession, true, screenStream);
  };

  const changeAudio = (userSessionId: string, muted: boolean) => {
    const changeAudioCcommand: ChangeAudioCommand = {
      userSessionId,
      isMuted: muted,
    };
    api.meeting.changeAudio(changeAudioCcommand);
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
      }
    );

    serverConnection?.current?.on('OtherJoined', (otherUser: IUserSession) => {
      otherUser.isSelf = false;
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        otherUser,
      ]);
    });

    serverConnection?.current?.on(
      'OtherUserSessionStatusChanged',
      (otherUser: IUserSession) => {
        userSessionConnectionManager.current.peerConnections =
          userSessionConnectionManager.current.peerConnections.filter(
            (x) => x.userSessionId !== otherUser.id
          );
        setUserSessions((oldUserSessions: IUserSession[]) => {
          const updateUserSessions = oldUserSessions.map((userSession) => {
            return userSession.id === otherUser.id ? otherUser : userSession;
          });
          return [...updateUserSessions];
        });
      }
    );

    serverConnection.current?.on(
      'OtherAudioChanged',
      (otherUser: IUserSession) => {
        setUserSessions((oldUserSessions: IUserSession[]) => {
          const changedUserSession = oldUserSessions.find(
            (x) => x.connectionId === otherUser.connectionId
          );
          if (changedUserSession)
            changedUserSession.isMuted = otherUser.isMuted;
          return [...oldUserSessions];
        });
      }
    );

    serverConnection?.current?.on('OtherLeft', (connectionId: string) => {
      removeUserSession(connectionId);
    });

    serverConnection?.current?.on(
      'ProcessAnswer',
      async (
        connectionId: string,
        answerSDP: string,
        isSharingCamera: boolean,
        isSharingScreen: boolean,
        peerConnectionId: string
      ) => {
        const isSelf = connectionId === serverConnection.current?.connectionId;
        const matchedPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) => x.peerConnection.id === peerConnectionId
          );
        matchedPeerConnection?.peerConnection.connection.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
        );
        if (isSelf) {
          const updateStatusCommand: UpdateStatusCommand = {
            connectionId,
            connectionStatus: UserSessionConnectionStatus.connected,
          };
          api.meeting.updateStatus(updateStatusCommand).then((response) => {
            response.data.isSelf = true;
            setUserSessions((oldUserSessions: IUserSession[]) => {
              const updateUserSessions = oldUserSessions.map((userSession) => {
                return userSession.id === response.data.id
                  ? response.data
                  : userSession;
              });
              return [...updateUserSessions];
            });
          });
        }
      }
    );

    serverConnection?.current?.on(
      'AddCandidate',
      (connectionId: string, candidate: string, peerConnectionId: string) => {
        const objCandidate = JSON.parse(candidate);
        const matchedPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) => x.peerConnection.id === peerConnectionId
          );
        matchedPeerConnection?.peerConnection.connection.addIceCandidate(
          objCandidate
        );
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
    isSelf: boolean,
    otherStreamToSend: MediaStream | undefined
  ) => {
    const peerConnectionId = GUID();
    const peer = new RTCPeerConnection();
    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.connectionId,
        peerConnectionId,
        candidate
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
        setUserSessions((oldUserSessions: IUserSession[]) => {
          const changedUserSession = oldUserSessions.find(
            (x) => x.connectionId === userSession.connectionId
          );
          if (changedUserSession)
            changedUserSession.isSharingScreen = userSession.isSharingScreen;
          return [...oldUserSessions];
        });
        setUserSessionVideos(
          (oldUserSessionVideos: IUserSessionMediaStream[]) => [
            ...oldUserSessionVideos,
            {
              userSessionId: userSession.id,
              connectionId: userSession.connectionId,
              stream,
            },
          ]
        );
      }
    });

    if (isSelf) {
      mediaStream.current?.getTracks().forEach((track: MediaStreamTrack) => {
        if (mediaStream.current) peer.addTrack(track, mediaStream.current);
      });
      if (otherStreamToSend) {
        otherStreamToSend
          .getTracks()
          .forEach((track) => peer.addTrack(track, otherStreamToSend));
      }
    }

    const offer = await peer.createOffer({
      offerToReceiveAudio: !isSelf,
      offerToReceiveVideo: !isSelf,
    });

    await peer.setLocalDescription(offer);

    const peerConnection: IUserRTCPeerConnection = {
      isSelf,
      userSessionId: userSession.id,
      connectionId: userSession.connectionId,
      peerConnection: {
        id: peerConnectionId,
        connection: peer,
      },
    };

    userSessionConnectionManager.current.peerConnections.push(peerConnection);

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      userSession.connectionId,
      offer.sdp,
      userSession.isSharingCamera,
      userSession.isSharingScreen,
      peerConnectionId
    );
  };

  const removeUserSession = (connectionId: string) => {
    userSessionConnectionManager.current.peerConnections =
      userSessionConnectionManager.current.peerConnections.filter(
        (x) => x.connectionId !== connectionId
      );
    setUserSessions((oldUserSessions: IUserSession[]) =>
      oldUserSessions.filter(
        (userSession: IUserSession) => userSession.connectionId !== connectionId
      )
    );
    setUserSessionAudios((oldUserSessionAudios: IUserSessionMediaStream[]) =>
      oldUserSessionAudios.filter(
        (userSessionAudio: IUserSessionMediaStream) =>
          userSessionAudio.connectionId !== connectionId
      )
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
