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
  const [localUserAdded, setLocalUserAdded] = React.useState<boolean>(false);
  const [otherUsersAdded, setOtherUsersAdded] = React.useState<boolean>(false);
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);
  const [meetingNumber, setmeetingNumber] = React.useState<string>('');

  const serverConnection = React.useRef<HubConnection>();
  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    // Basic info setup
    const meetingParam = queryString.parse(location.search, {
      parseBooleans: true,
    }) as unknown as IMeetingQueryStringParams;

    const initMediaDeviceStatus = async () => {
      const hasMicrophone = await getMediaDeviceAccessAndStatus('microphone');
      if (hasMicrophone === false) {
        showRequestMediaAccessDialog();
        electron.remote.getCurrentWindow().close();
      }
    };

    initMediaDeviceStatus();

    setAudio(meetingParam.connectedWithAudio);

    const joinMeetingCommand: JoinMeetingCommand = {
      meetingNumber: meetingParam.meetingId,
    };

    api.meeting.joinMeeting(joinMeetingCommand);

    setupSignalrForMyself(meetingParam.userName, meetingParam.meetingId);

    setmeetingNumber(meetingParam.meetingId);
  }, []);

  React.useEffect(() => {
    if (localUserAdded && otherUsersAdded) {
      setinitialized(true);
    }
  }, [localUserAdded, otherUsersAdded]);

  React.useEffect(() => {
    if (initialized) {
      setupSignalrForOthers();
      for (let i = 0; i < userSessions.length; i++) {
        userSessions[i].recvOnlyPeerConnections = [];
        createPeerConnection(userSessions[i], userSessions[i].isSelf);
      }
    }
  }, [initialized]);

  const setupSignalrForMyself = (userName: string, meetingId: string) => {
    const wsUrl = `${Env.apiUrl}meetingHub?username=${userName}&meetingNumber=${meetingId}`;
    serverConnection.current = new HubConnectionBuilder()
      .withUrl(wsUrl, { accessTokenFactory: () => userStore.idToken })
      .build();

    serverConnection.current.onclose((error?: Error) => {
      if (error?.message.includes('MeetingNotFoundException')) {
        alert('Meeting not found.');
        electron.remote.getCurrentWindow().close();
      }
    });

    serverConnection?.current?.on('SetLocalUser', (localUser: IUserSession) => {
      localUser.isSelf = true;
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        localUser,
      ]);
      setLocalUserAdded(true);
    });

    serverConnection?.current?.on(
      'SetOtherUsers',
      (otherUsers: IUserSession[]) => {
        setUserSessions((oldUserSessions: IUserSession[]) => [
          ...oldUserSessions,
          ...otherUsers,
        ]);
        setOtherUsersAdded(true);
      }
    );

    serverConnection.current?.start().catch((err?: any) => {
      if (err?.statusCode === 401) {
        alert('Unauthorized.');
        electron.remote.getCurrentWindow().close();
      }
    });
  };

  const setupSignalrForOthers = () => {
    serverConnection?.current?.on('OtherJoined', (otherUser: IUserSession) => {
      otherUser.isSelf = false;
      setUserSessions((oldUserSessions: IUserSession[]) => [
        ...oldUserSessions,
        otherUser,
      ]);
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
        const isSelf = connectionId === serverConnection.current?.connectionId;
        const matchedUserSession = userSessions.find(
          (x) => x.connectionId === connectionId
        );
        if (!isSelf) {
          if (matchedUserSession) {
            const matchedPeerConnection =
              matchedUserSession.recvOnlyPeerConnections.find(
                (x) => x.connectionId === connectionId
              );
            matchedPeerConnection?.peerConnection.setRemoteDescription(
              new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
            );
          }
        } else {
          matchedUserSession?.sendOnlyPeerConnection?.setRemoteDescription(
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
        const matchedUserSession = userSessions.find(
          (x) => x.connectionId === connectionId
        );
        if (matchedUserSession) {
          if (isSelf) {
            if (matchedUserSession.sendOnlyPeerConnection) {
              matchedUserSession.sendOnlyPeerConnection.addIceCandidate(
                objCandidate
              );
            }
          } else {
            const matchedConnection =
              matchedUserSession.recvOnlyPeerConnections?.find(
                (x) => x.connectionId === connectionId
              );
            if (matchedConnection) {
              matchedConnection.peerConnection.addIceCandidate(objCandidate);
            }
          }
        }
      }
    );
  };

  const createPeerConnection = async (
    userSession: IUserSession,
    isSelf: boolean
  ) => {
    const peer = new RTCPeerConnection();
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
      userSession.sendOnlyPeerConnection = peer;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.kind === 'audio') track.enabled = true;
        userSession.sendOnlyPeerConnection?.addTrack(track, stream);
      });

      const offer = await userSession.sendOnlyPeerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await userSession.sendOnlyPeerConnection.setLocalDescription(offer);

      await serverConnection?.current?.invoke(
        'ProcessOfferAsync',
        userSession.connectionId,
        offer.sdp,
        true,
        userSession.isSharingCamera,
        userSession.isSharingScreen
      );
    } else {
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peer.setLocalDescription(offer);

      userSession.recvOnlyPeerConnections = [
        ...userSession.recvOnlyPeerConnections,
        { connectionId: userSession.connectionId, peerConnection: peer },
      ];

      await serverConnection?.current?.invoke(
        'ProcessOfferAsync',
        userSession.connectionId,
        offer.sdp,
        false,
        userSession.isSharingCamera,
        userSession.isSharingScreen
      );
    }
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
