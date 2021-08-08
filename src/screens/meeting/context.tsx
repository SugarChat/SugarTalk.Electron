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
import { IUserSession } from '../../dtos/schedule-meeting-command';

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
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

  const [meetingNumber, setMeetingNumber] = React.useState<string>('');
  const serverConnection = React.useRef<HubConnection>();
  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    const meetingInfo = queryString.parse(location.search, {
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

    setAudio(meetingInfo.connectedWithAudio);

    setMeetingNumber(meetingInfo.meetingId);

    const wsUrl = `${Env.apiUrl}meetingHub?username=${meetingInfo.userName}&meetingNumber=${meetingInfo.meetingId}`;
    serverConnection.current = new HubConnectionBuilder()
      .withUrl(wsUrl, { accessTokenFactory: () => userStore.idToken })
      .build();

    serverConnection.current.onclose((error?: Error) => {
      if (error?.message.includes('MeetingNotFoundException')) {
        alert('Meeting not found.');
        electron.remote.getCurrentWindow().close();
      }
    });

    serverConnection.current?.start().catch((err?: any) => {
      if (err?.statusCode === 401) {
        alert('Unauthorized.');
        electron.remote.getCurrentWindow().close();
      }
    });

    serverConnection?.current?.on('SetLocalUser', (localUser: IUserSession) => {
      createUserSession(localUser, true);
    });

    serverConnection?.current?.on(
      'SetOtherUsers',
      (otherUsers: IUserSession[]) => {
        otherUsers.forEach((user: IUserSession) => {
          createUserSession(user, false);
        });
      }
    );

    serverConnection?.current?.on('OtherJoined', (otherUser: IUserSession) => {
      createUserSession(otherUser, false);
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
        const matchedUserSession = userSessions.find(
          (x) => x.connectionId === connectionId
        );
        if (matchedUserSession) {
          const updatedUserSession = {
            ...matchedUserSession,
            isSharingCamera,
            isSharingScreen,
            sdp: answerSDP,
          };
          const newUserSessions: IUserSession[] = [
            ...userSessions.filter((x) => x.connectionId !== connectionId),
            updatedUserSession,
          ];
          setUserSessions(newUserSessions);
        }
      }
    );

    serverConnection?.current?.on(
      'NewOfferCreated',
      async (
        connectionId: string,
        answerSDP: string,
        isSharingCamera: boolean,
        isSharingScreen: boolean
      ) => {
        const meetingSessionDto = await Api.meeting.getMeetingSession({
          meetingNumber,
        });

        const newUserSessions = Object.entries(
          meetingSessionDto.data.userSessions
        ).map((key, v) => {
          return key[1];
        }) as IUserSession[];

        setUserSessions(newUserSessions);

        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onNewOfferCreated(
            connectionId,
            answerSDP,
            isSharingCamera,
            isSharingScreen
          );
        }
      }
    );

    serverConnection?.current?.on(
      'AddCandidate',
      (connectionId: string, candidate: string) => {
        // TODO: Find the matched usersession, set the iceCandidate to the RTCPeerConnection
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onAddCandidate(
            connectionId,
            candidate
          );
        }
      }
    );

    return () => {
      serverConnection.current?.stop();
    };
  }, []);

  const createUserSession = async (user: IUserSession, isSelf: boolean) => {
    const userSession: IUserSession = {
      id: user.id,
      connectionId: user.connectionId,
      userName: user.userName,
      isSelf,
      userPicture: user.userPicture,
      isSharingCamera: false,
      isSharingScreen: false,
      sendOnlyPeerConnection: undefined,
      recvOnlyPeerConnections: [],
      sdp: '',
    };

    const peer = new RTCPeerConnection();
    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.connectionId,
        candidate
      );
    });

    if (isSelf) {
      userSession.sendOnlyPeerConnection = peer;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.kind === 'audio') track.enabled = audio;
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await peer.setLocalDescription(offer);

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

      await serverConnection?.current?.invoke(
        'ProcessOfferAsync',
        userSession.connectionId,
        offer.sdp,
        false,
        userSession.isSharingCamera,
        userSession.isSharingScreen
      );
      userSession.recvOnlyPeerConnections = [
        ...userSession.recvOnlyPeerConnections,
        peer,
      ];
    }

    setUserSessions((oldUserSessions: IUserSession[]) => [
      ...oldUserSessions,
      userSession,
    ]);
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
