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
  IUserRTCPeerConnectionType,
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
  screenStream: MediaStream | undefined;
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
  screenStream: undefined,
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
  const selfUserSession = React.useRef<IUserSession>();
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
  const [screenStream, setScreenStream] = React.useState<MediaStream>();
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
      selfUserSession.current = userSessions.find((x) => x.isSelf);
    }
  }, [localUserAdded]);

  React.useEffect(() => {
    if (otherUsersAdded) {
      userSessions
        .filter((x) => !x.isSelf)
        .forEach((otherUser) => {
          if (selfUserSession.current) {
            createOfferPeerConnection(
              selfUserSession.current,
              otherUser,
              mediaStream.current,
              UserSessionWebRtcConnectionMediaType.audio
            );
          }
        });
    }
  }, [otherUsersAdded]);

  // useInterval(() => {
  //   syncMeeting();
  // }, 2500);

  React.useEffect(() => {
    if (mediaStreamInitialized && mediaStream.current) {
      mediaStream.current.getAudioTracks()[0].enabled = !isMuted;
      const selfUser = userSessions.find((x) => x.isSelf);
      if (selfUser) {
        selfUser.isMuted = isMuted;
        updateUserSession(selfUser);
        changeAudio(selfUser.id, isMuted);
      }
    }
  }, [isMuted, mediaStreamInitialized]);

  React.useEffect(() => {
    if (selfUserSession.current) {
      const shareScreen = async (shareScreenCommand: ShareScreenCommand) => {
        const response = await api.meeting.shareScreen(shareScreenCommand);
        updateUserSession(response.data);
      };
      const removeScreenConnection = async () => {
        const screenPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) =>
              //x.isSelf &&
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
        userSessionId: selfUserSession.current.id,
        isShared: true,
      };
      if (!currentScreenId && selfUserSession.current.isSharingScreen) {
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
          .then(async (gotStream) => {
            gotStream.getVideoTracks().forEach((x) => {
              x.contentHint = 'detail';
              x.applyConstraints({
                width: { min: 640, ideal: 1920, max: 1920 },
                height: { min: 400, ideal: 1080 },
                frameRate: { min: 120, ideal: 120, max: 120 },
              });
            });
            shareScreenCommand.isShared = true;
            shareScreen(shareScreenCommand);
            // createPeerConnection(
            //   selfUserSession,
            //   gotStream,
            //   UserSessionWebRtcConnectionMediaType.screen
            // );
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
          // const hasConnection =
          //   userSessionConnectionManager.current.peerConnections.some(
          //     (x) =>
          //       x.userSessionId === otherUser.id &&
          //       x.receiveWebRtcConnectionId === connection.id
          //   );
          // if (!hasConnection) {
          //   createPeerConnection(
          //     otherUser,
          //     undefined,
          //     connection.mediaType,
          //     connection.id
          //   );
          // }
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

  const updateUserSessionConnection = (
    userSessionConnection: IUserRTCPeerConnection
  ) => {
    userSessionConnectionManager.current.peerConnections =
      userSessionConnectionManager.current.peerConnections.map(
        (sessionConnection) => {
          if (
            sessionConnection.userSessionId ===
            userSessionConnection.userSessionId
          ) {
            return userSessionConnection;
          }
          return sessionConnection;
        }
      );
  };

  const removeUserSession = (userSession: IUserSession) => {
    setUserSessions((oldUserSessions: IUserSession[]) =>
      oldUserSessions.filter(
        (oldUserSession: IUserSession) => oldUserSession.id !== userSession.id
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

    // serverConnection?.current?.on(
    //   'OtherUserSessionWebRtcConnectionRemoved',
    //   (removedConnection: UserSessionWebRtcConnection) => {
    //     const receiveConnection =
    //       userSessionConnectionManager.current.peerConnections.find(
    //         (x) => x.receiveWebRtcConnectionId === removedConnection.id
    //       );
    //     if (receiveConnection) closeAndRemoveConnection(receiveConnection);
    //   }
    // );

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
      'OtherOfferSent',
      async (
        sendFromUserSession: IUserSession,
        offerPeerConnectionId: string,
        offerToJson: string
      ) => {
        if (selfUserSession.current && mediaStream.current) {
          await createAnswerPeerConnection(
            selfUserSession.current,
            sendFromUserSession,
            mediaStream.current,
            UserSessionWebRtcConnectionMediaType.audio,
            offerPeerConnectionId,
            JSON.parse(offerToJson)
          );
          console.log(
            'OtherOfferSent',
            userSessionConnectionManager.current.peerConnections
          );
        }
      }
    );

    serverConnection?.current?.on(
      'OtherAnswerSent',
      async (
        sendFromUserSession: IUserSession,
        offerPeerConnectionId: string,
        answerPeerConnectionId: string,
        answerToJson: string
      ) => {
        const matchedPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) =>
              x.peerConnectionId === offerPeerConnectionId &&
              x.userSessionId === sendFromUserSession.id
          );
        if (matchedPeerConnection) {
          await matchedPeerConnection.peerConnection.setRemoteDescription(
            JSON.parse(answerToJson)
          );
          matchedPeerConnection.relatedPeerConnectionId =
            answerPeerConnectionId;
          updateUserSessionConnection(matchedPeerConnection);
          console.log(
            'OtherAnswerSent',
            userSessionConnectionManager.current.peerConnections
          );
        }
      }
    );

    serverConnection?.current?.on(
      'OtherCandidateCreated',
      async (peerConnectionId: string, candidateToJson: string) => {
        const matchedPeerConnection =
          userSessionConnectionManager.current.peerConnections.find(
            (x) => x.relatedPeerConnectionId === peerConnectionId
          );
        if (matchedPeerConnection) {
          console.log(
            'OtherCandidateCreated connection found',
            matchedPeerConnection
          );
          await matchedPeerConnection.peerConnection.addIceCandidate(
            JSON.parse(candidateToJson)
          );
        } else {
          console.log(
            'OtherCandidateCreated connection not found',
            matchedPeerConnection
          );
          await serverConnection?.current?.invoke(
            'ConnectionNotFoundWhenOtherIceSent',
            selfUserSession.current,
            peerConnectionId,
            candidateToJson
          );
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

  const createOfferPeerConnection = async (
    sendFromUserSession: IUserSession,
    sendToUserSession: IUserSession,
    streamToSend: MediaStream | undefined,
    mediaType: UserSessionWebRtcConnectionMediaType
  ) => {
    const peerConnectionId = GUID();
    const peerConnection = new RTCPeerConnection();
    const peerConnectionType = IUserRTCPeerConnectionType.offer;

    bindPeerConnectionEventListener(
      peerConnection,
      peerConnectionId,
      sendToUserSession,
      mediaType
    );

    if (streamToSend)
      streamToSend.getTracks().forEach((track) => {
        peerConnection.addTrack(track, streamToSend);
      });

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peerConnection.setLocalDescription(offer);

    userSessionConnectionManager.current.peerConnections.push({
      userSessionId: sendToUserSession.id,
      peerConnectionId,
      peerConnection,
      mediaType,
      type: peerConnectionType,
    });

    await serverConnection?.current?.invoke(
      'ProcessOffer',
      sendFromUserSession,
      sendToUserSession,
      peerConnectionId,
      JSON.stringify(offer)
    );
  };

  const createAnswerPeerConnection = async (
    sendFromUserSession: IUserSession,
    sendToUserSession: IUserSession,
    streamToSend: MediaStream,
    mediaType: UserSessionWebRtcConnectionMediaType,
    offerPeerConnectionId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    const peerConnectionId = GUID();
    const peerConnection = new RTCPeerConnection();
    const peerConnectionType = IUserRTCPeerConnectionType.answer;

    bindPeerConnectionEventListener(
      peerConnection,
      peerConnectionId,
      sendToUserSession,
      mediaType
    );

    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => {
        peerConnection.addTrack(track, streamToSend);
      });
    }

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peerConnection.setLocalDescription(answer);

    userSessionConnectionManager.current.peerConnections.push({
      userSessionId: sendToUserSession.id,
      peerConnectionId,
      peerConnection,
      mediaType,
      type: peerConnectionType,
      relatedPeerConnectionId: offerPeerConnectionId,
    });

    await serverConnection?.current?.invoke(
      'ProcessAnswer',
      sendFromUserSession,
      sendToUserSession,
      offerPeerConnectionId,
      peerConnectionId,
      JSON.stringify(answer)
    );
  };

  const bindPeerConnectionEventListener = (
    peer: RTCPeerConnection,
    peerConnectionId: string,
    sendToUserSession: IUserSession,
    mediaType: UserSessionWebRtcConnectionMediaType
  ) => {
    peer.addEventListener('icecandidate', (e) => {
      serverConnection?.current?.invoke(
        'ProcessCandidate',
        sendToUserSession,
        peerConnectionId,
        JSON.stringify(e.candidate)
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
                userSessionId: sendToUserSession.id,
                connectionId: sendToUserSession.connectionId,
                stream,
              },
            ];
          }
        );
      } else if (e.track.kind === 'video') {
        if (mediaType === UserSessionWebRtcConnectionMediaType.screen) {
          setScreenStream(stream);
        } else {
          setUserSessionVideos(() => [
            {
              userSessionId: sendToUserSession.id,
              connectionId: sendToUserSession.connectionId,
              stream,
            },
          ]);
        }
      }
    });
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
        screenStream,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
