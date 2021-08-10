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
  IUserRTCPeerConnection,
} from '../../dtos/schedule-meeting-command';
import api from '../../services/api';

export interface IMeetingQueryStringParams {
  meetingId: string;
  userName: string;
  connectedWithAudio: boolean;
  connectedWithVideo: boolean;
}

interface IMeetingContext {
  serverConnection:
    | React.MutableRefObject<HubConnection | undefined>
    | undefined;
  meetingNumber: string;
  userSessions: IUserSession[];
}

export const MeetingContext = React.createContext<IMeetingContext>({
  serverConnection: undefined,
  meetingNumber: '',
  userSessions: [],
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [audio, setAudio] = React.useState<boolean>(false);
  const [video, setVideo] = React.useState<boolean>(false);
  const [screen, setScreen] = React.useState<boolean>(false);
  const [screenSelecting, setScreenSelecting] = React.useState<boolean>(false);
  const [initialized, setinitialized] = React.useState<boolean>(false);
  const [meetingJoined, setMeetingJoined] = React.useState<boolean>(false);
  const [localUserAdded, setLocalUserAdded] = React.useState<boolean>(false);
  const [otherUsersAdded, setOtherUsersAdded] = React.useState<boolean>(false);
  const [signalrConnected, setSignalrConnected] =
    React.useState<boolean>(false);
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);
  const [meetingNumber, setMeetingNumber] = React.useState<string>('');
  const [meetingParam, setMeetingParam] =
    React.useState<IMeetingQueryStringParams>();
  const serverConnection = React.useRef<HubConnection>();
  const location = useLocation();
  const { userStore } = useStores();
  const userSessionConnections = React.useRef<IUserSessionConnection[]>([]);

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

      initMediaDeviceStatus();

      setAudio(meetingParam.connectedWithAudio);

      const joinTheMeeting = async () => {
        const joinMeetingCommand: JoinMeetingCommand = {
          meetingNumber: meetingParam.meetingId,
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
    console.log('effer', userSessions);
  }, [userSessions]);

  React.useEffect(() => {
    if (initialized) {
      console.log('user', userSessions);
      for (let i = 0; i < userSessions.length; i++) {
        createPeerConnection(userSessions[i], userSessions[i].isSelf);
      }
    }
  }, [initialized]);

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
      console.log('other joined', userSessions);
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        otherUser,
      ]);
      console.log('other joined', userSessions);
      createPeerConnection(otherUser, otherUser.isSelf);
    });

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
        console.log('---process answser----');
        console.log('ProcessAnswer', userSessionConnections);
        const isSelf = connectionId === serverConnection.current?.connectionId;
        const matchedSessionConnection = userSessionConnections.current.find(
          (x) => x.connectionId === connectionId
        );
        if (!isSelf) {
          if (matchedSessionConnection) {
            const matchedPeerConnection =
              matchedSessionConnection.recvOnlyPeerConnections.find(
                (x) => x.connectionId === connectionId
              );
            matchedPeerConnection?.peerConnection.setRemoteDescription(
              new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
            );
          }
        } else {
          matchedSessionConnection?.sendOnlyPeerConnection?.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
          );
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
          if (isSelf) {
            if (matchedSessionConnection.sendOnlyPeerConnection) {
              matchedSessionConnection.sendOnlyPeerConnection.addIceCandidate(
                objCandidate
              );
            }
          } else {
            const matchedConnection =
              matchedSessionConnection.recvOnlyPeerConnections?.find(
                (x) => x.connectionId === connectionId
              );
            if (matchedConnection) {
              matchedConnection.peerConnection.addIceCandidate(objCandidate);
            }
          }
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
    isSelf: boolean
  ) => {
    const peer = new RTCPeerConnection();
    const userSessionConnection = {
      userSessionId: userSession.id,
      connectionId: userSession.connectionId,
      sendOnlyPeerConnection: peer,
      recvOnlyPeerConnections: [] as IUserRTCPeerConnection[],
    };
    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.connectionId,
        candidate
      );
    });
    peer.addEventListener(
      'track',
      (e) => {
        console.log('track');
        if (e.track.kind === 'audio') {
          const stream = e.streams[0];
          userSession.audioStream = stream;
          setUserSessions(
            userSessions.map((session) =>
              session.connectionId === userSession.connectionId
                ? { ...userSession }
                : session
            )
          );
        }
      },
      false
    );
    if (isSelf) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.kind === 'audio') track.enabled = true;
        userSessionConnection.sendOnlyPeerConnection?.addTrack(track, stream);
      });
    } else {
      userSessionConnection.recvOnlyPeerConnections.push({
        connectionId: userSession.connectionId,
        peerConnection: peer,
      });
    }
    const offer =
      await userSessionConnection.sendOnlyPeerConnection.createOffer({
        offerToReceiveAudio: !isSelf,
        offerToReceiveVideo: !isSelf,
      });
    await userSessionConnection.sendOnlyPeerConnection.setLocalDescription(
      offer
    );
    userSessionConnections.current = [
      ...userSessionConnections.current,
      userSessionConnection,
    ];
    console.log('ProcessOfferAsync', userSessionConnections);
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
  };

  return (
    <MeetingContext.Provider
      value={{
        serverConnection,
        meetingNumber,
        userSessions,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
