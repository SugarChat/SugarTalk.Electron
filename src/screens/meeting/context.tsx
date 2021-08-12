import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import electron from 'electron';
import Env from '../../config/env';
import { useStores } from '../../contexts/root-context';
import {
  getMediaDeviceAccessAndStatus,
  showRequestMediaAccessDialog,
} from '../../utils/media';
import {
  JoinMeetingCommand,
  IUserSession,
  IUserSessionConnection,
  IUserSessionMediaStream,
  ChangeAudioCommand,
} from '../../dtos/schedule-meeting-command';
import api from '../../services/api';

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
  const [initialized, setinitialized] = React.useState<boolean>(false);
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
  const userSessionConnections = React.useRef<IUserSessionConnection[]>([]);

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
    if (localUserAdded && otherUsersAdded) {
      setinitialized(true);
    }
  }, [localUserAdded, otherUsersAdded]);

  React.useEffect(() => {
    if (initialized) {
      for (let i = 0; i < userSessions.length; i++) {
        createPeerConnection(
          userSessions[i],
          userSessions[i].isSelf,
          undefined,
          true
        );
      }
    }
  }, [initialized]);

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
    if (currentScreenId) {
      const videoConstraints: any = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: currentScreenId,
          minWidth: 1080,
          maxWidth: 1080,
          minHeight: 520,
          maxHeight: 520,
        },
      };
      navigator.mediaDevices
        .getUserMedia({
          video: videoConstraints,
          audio: false,
        })
        .then(async (screenStream) => {
          const currentUser = userSessions.find((x) => x.isSelf);

          console.log(currentUser);
          if (currentUser) {
            const userSession: IUserSession = {
              ...currentUser,
              isSharingScreen: true,
            };

            await createPeerConnection(userSession, true, screenStream, false);
          }
        });
    }
  }, [currentScreenId]);

  const changeAudio = (userSessionId: string, muted: boolean) => {
    const changeAudioCcommand: ChangeAudioCommand = {
      UserSessionId: userSessionId,
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
        setOtherUsersAdded(true);
      }
    );

    serverConnection?.current?.on('OtherJoined', (otherUser: IUserSession) => {
      otherUser.isSelf = false;
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        otherUser,
      ]);
      createPeerConnection(otherUser, otherUser.isSelf, undefined, true);
    });

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
        isSharingScreen: boolean
      ) => {
        const isSelf = connectionId === serverConnection.current?.connectionId;

        console.log('---self----', isSelf);

        const matchedSessionConnection = userSessionConnections.current.find(
          (x) => x.connectionId === connectionId
        );
        if (matchedSessionConnection) {
          const matchedPeerConnection =
            matchedSessionConnection.peerConnections.find(
              (x) => x.connectionId === connectionId && x.isSelf === isSelf
            );
          matchedPeerConnection?.peerConnection.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
          );
        }
        if (isSelf) {
          serverConnection?.current?.invoke('OnNewUserFinishedSetup');
        }
      }
    );

    serverConnection?.current?.on(
      'AddCandidate',
      (connectionId: string, candidate: string) => {
        const objCandidate = JSON.parse(candidate);
        const isSelf = connectionId === serverConnection.current?.connectionId;
        const matchedSessionConnection = userSessionConnections.current.find(
          (x) => x.connectionId === connectionId
        );
        if (matchedSessionConnection) {
          const matchedPeerConnection =
            matchedSessionConnection.peerConnections.find(
              (x) => x.connectionId === connectionId && x.isSelf === isSelf
            );
          matchedPeerConnection?.peerConnection.addIceCandidate(objCandidate);
        }
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
    otherStreamToSend: MediaStream | undefined,
    shouldBindListener: boolean
  ) => {
    const peer = new RTCPeerConnection();
    const existingUserSessionConnection = userSessionConnections.current.find(
      (x) => x.connectionId === userSession.connectionId
    );
    const existringPeerConnections = existingUserSessionConnection
      ? existingUserSessionConnection.peerConnections
      : [];
    const userSessionConnection: IUserSessionConnection = {
      userSessionId: userSession.id,
      connectionId: userSession.connectionId,
      peerConnections: [...existringPeerConnections],
    };

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.connectionId,
        candidate
      );
    });
    peer.addEventListener('track', (e: RTCTrackEvent) => {
      if (e.track.kind === 'audio') {
        const stream = e.streams[0];
        setUserSessionAudios(
          (oldUserSessionAudios: IUserSessionMediaStream[]) => [
            ...oldUserSessionAudios,
            {
              userSessionId: userSession.id,
              connectionId: userSession.connectionId,
              stream: stream,
            },
          ]
        );
      } else if (e.track.kind === 'video') {
        console.log('----video-----');
        const stream = e.streams[0];
        setUserSessionVideos(
          (oldUserSessionVideos: IUserSessionMediaStream[]) => [
            ...oldUserSessionVideos,
            {
              userSessionId: userSession.id,
              connectionId: userSession.connectionId,
              stream: stream,
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

      // Recreate peerConnection for self should remove the old one first

      userSessionConnection.peerConnections =
        userSessionConnection.peerConnections.filter(
          (x) => x.connectionId !== userSession.connectionId
        );
    }
    const offer = await peer.createOffer({
      offerToReceiveAudio: !isSelf,
      offerToReceiveVideo: !isSelf,
    });
    await peer.setLocalDescription(offer);

    userSessionConnection.peerConnections.push({
      isSelf,
      connectionId: userSession.connectionId,
      peerConnection: peer,
    });

    userSessionConnections.current = userSessionConnections.current.filter(
      (x) => x.connectionId !== userSession.connectionId
    );
    userSessionConnections.current = [
      ...userSessionConnections.current,
      userSessionConnection,
    ];
    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      userSession.connectionId,
      offer.sdp,
      isSelf,
      userSession.isSharingCamera,
      userSession.isSharingScreen
    );
  };

  const removeUserSession = (connectionId: string) => {
    // TODO 理论上可能需要把对于的usersession里面的RTCPeerConnection清理一下
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
    userSessionConnections.current = userSessionConnections.current.filter(
      (userSessionConnection) =>
        userSessionConnection.connectionId !== connectionId
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
