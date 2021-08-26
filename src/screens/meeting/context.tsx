import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
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
  IUserRTCPeerConnection,
  GetMeetingSessionRequest,
  ShareScreenCommand,
  IUserRTCPeerConnectionType,
  IUserRTCPeerConnectionMediaType,
  IUserSessionMediaStreamVolume,
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
  userSessionAudioVolumes: IUserSessionMediaStreamVolume[];
  userSessionVideos: IUserSessionMediaStream[];
  otherScreenSharedStream: IUserSessionMediaStream | undefined;
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
  userSessionAudioVolumes: [],
  userSessionVideos: [],
  otherScreenSharedStream: undefined,
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
  const [localUserInitialized, setLocalUserInitialized] =
    React.useState<boolean>(false);
  const [signalrConnected, setSignalrConnected] =
    React.useState<boolean>(false);
  const [canSyncMeeting, setCanSyncMeeting] = React.useState<boolean>(false);
  const selfUserSession = React.useRef<IUserSession>();
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);
  const [userSessionAudios, setUserSessionAudios] = React.useState<
    IUserSessionMediaStream[]
  >([]);
  const [userSessionAudioVolumes, setUserSessionAudioVolumes] = React.useState<
    IUserSessionMediaStreamVolume[]
  >([]);
  const [userSessionVideos, setUserSessionVideos] = React.useState<
    IUserSessionMediaStream[]
  >([]);
  const [otherScreenSharedStream, setOtherScreenSharedStream] = React.useState<
    IUserSessionMediaStream | undefined
  >(undefined);

  const [meetingNumber, setMeetingNumber] = React.useState<string>('');
  const [meetingParam, setMeetingParam] =
    React.useState<IMeetingQueryStringParams>();

  const audioStream = React.useRef<MediaStream>(new MediaStream());
  const [audioStreamInitialized, setAudioStreamInitialized] =
    React.useState<boolean>(false);
  const screenStream = React.useRef<MediaStream>();

  const serverConnection = React.useRef<HubConnection>();
  const userSessionConnectionManager =
    React.useRef<IUserSessionConnectionManager>({ peerConnections: [] });

  const iceServers = React.useRef<RTCIceServer[]>([]);

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
      const initAudioStream = async () => {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setAudioStreamInitialized(true);
      };

      initMediaDeviceStatus();
      initAudioStream();

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
      const getIceServers = async () => {
        await api.meeting.getIceServers().then((response) => {
          iceServers.current = response;
        });
      };

      joinTheMeeting();
      getIceServers();

      setCanSyncMeeting(true);
    }
  }, [meetingParam]);

  React.useEffect(() => {
    if (meetingJoined && meetingParam) {
      setupSignalr(meetingParam.userName, meetingParam.meetingId);
      connectSignrlr();
    }
  }, [meetingJoined]);

  React.useEffect(() => {
    if (signalrConnected) {
      setupSignalrHubMethodHandlers();
    }
  }, [signalrConnected]);

  React.useEffect(() => {
    if (localUserAdded) {
      selfUserSession.current = userSessions.find((x) => x.isSelf);
      setLocalUserInitialized(true);
    }
  }, [localUserAdded]);

  React.useEffect(() => {
    if (
      localUserInitialized &&
      audioStreamInitialized &&
      selfUserSession.current
    ) {
      trackingAudioVolume(selfUserSession.current, audioStream.current);
      setUserSessionAudioVolumes([
        ...userSessionAudioVolumes,
        {
          userSessionId: selfUserSession.current.id,
          volume: 0,
        },
      ]);
    }
  }, [localUserInitialized, audioStreamInitialized]);

  React.useEffect(() => {
    if (otherUsersAdded && audioStreamInitialized) {
      userSessions
        .filter((x) => !x.isSelf)
        .forEach((otherUserSession) => {
          if (selfUserSession.current) {
            createOfferPeerConnection(
              selfUserSession.current,
              otherUserSession,
              audioStream.current,
              IUserRTCPeerConnectionMediaType.audio
            );
          }
        });
    }
  }, [otherUsersAdded]);

  React.useEffect(() => {
    if (audioStreamInitialized) {
      audioStream.current.getAudioTracks()[0].enabled = !isMuted;
      const selfUser = userSessions.find((x) => x.isSelf);
      if (selfUser) {
        selfUser.isMuted = isMuted;
        updateUserSession(selfUser);
        changeAudio(selfUser.id, isMuted);
      }
    }
  }, [isMuted, audioStreamInitialized]);

  React.useEffect(() => {
    if (selfUserSession.current) {
      const shareScreen = async (shareScreenCommand: ShareScreenCommand) => {
        const response = await api.meeting.shareScreen(shareScreenCommand);
        updateUserSession(response.data);
      };
      const removeScreenConnections = () => {
        const screenPeerConnections =
          userSessionConnectionManager.current.peerConnections.filter(
            (x) =>
              x.peerConnectionType === IUserRTCPeerConnectionType.offer &&
              x.peerConnectionMediaType ===
                IUserRTCPeerConnectionMediaType.screen
          );
        if (screenPeerConnections) {
          closeAndRemoveConnections(screenPeerConnections);
        }
      };
      const shareScreenCommand: ShareScreenCommand = {
        userSessionId: selfUserSession.current.id,
        isShared: true,
      };
      if (!currentScreenId && selfUserSession.current.isSharingScreen) {
        screenStream.current = undefined;
        shareScreenCommand.isShared = false;
        shareScreen(shareScreenCommand);
        removeScreenConnections();
      } else {
        const videoConstraints: any = {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: currentScreenId,
          },
          optional: [{ minFrameRate: 15 }, { aspectRatio: 16 / 9 }],
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
                frameRate: { min: 0, ideal: 15, max: 15 },
              });
            });
            screenStream.current = gotStream;
            shareScreenCommand.isShared = true;
            await shareScreen(shareScreenCommand);
            await connectToOtherUsersIfRequire(
              userSessions.filter((x) => !x.isSelf)
            );
          });
      }
    }
  }, [currentScreenId]);

  useInterval(
    async () => {
      if (isCurrentStateCanSyncMeeting()) await syncMeeting();
    },
    canSyncMeeting ? 5000 : null
  );

  const isCurrentStateCanSyncMeeting = (): boolean => {
    return serverConnection.current?.state === HubConnectionState.Connected;
  };

  const syncMeeting = async () => {
    const getMeetingSessionRequest: GetMeetingSessionRequest = {
      meetingNumber,
    };
    await api.meeting
      .getMeetingSession(getMeetingSessionRequest)
      .then(async (response) => {
        const connectionId = serverConnection.current?.connectionId;
        const newUserSessions = response.data.userSessions.map(
          (userSession) => {
            userSession.isSelf = userSession.connectionId === connectionId;
            return userSession;
          }
        );
        if (JSON.stringify(userSessions) !== JSON.stringify(newUserSessions)) {
          setUserSessions(newUserSessions);
          updateSelfUserSessionFromNewList(newUserSessions);
        }
        await connectToOtherUsersIfRequire(
          newUserSessions.filter((x) => !x.isSelf)
        );
      });
  };

  const updateSelfUserSessionFromNewList = (
    newUserSessions: IUserSession[]
  ) => {
    const newSelfUserSession = newUserSessions.find((x) => x.isSelf);
    if (newSelfUserSession) {
      selfUserSession.current = newSelfUserSession;
    }
  };

  const connectToOtherUsersIfRequire = async (otherUsers: IUserSession[]) => {
    otherUsers.map(async (otherUser) => {
      await connectToOtherUserIfRequire(otherUser);
      return otherUser;
    });
  };

  const connectToOtherUserIfRequire = async (
    otherUserSession: IUserSession
  ) => {
    await sendStreamToOtherUserIfNotBuilt(
      otherUserSession,
      audioStream.current,
      IUserRTCPeerConnectionMediaType.audio
    );
    await sendStreamToOtherUserIfNotBuilt(
      otherUserSession,
      screenStream.current,
      IUserRTCPeerConnectionMediaType.screen
    );
  };

  const sendStreamToOtherUserIfNotBuilt = async (
    otherUserSession: IUserSession,
    currentStream: MediaStream | undefined,
    currentStreamType: IUserRTCPeerConnectionMediaType
  ) => {
    if (currentStream) {
      const hasOfferTheStreamConnection =
        userSessionConnectionManager.current.peerConnections.some(
          (x) =>
            x.userSessionId === otherUserSession.id &&
            x.peerConnectionMediaType === currentStreamType &&
            x.peerConnectionType === IUserRTCPeerConnectionType.offer
        );
      if (!hasOfferTheStreamConnection && selfUserSession.current) {
        await createOfferPeerConnection(
          selfUserSession.current,
          otherUserSession,
          currentStream,
          currentStreamType
        );
      }
    }
  };

  const closeAndRemoveConnections = async (
    connections: IUserRTCPeerConnection[],
    shouldNotify = true
  ) => {
    if (connections?.length) {
      connections.forEach((connection) => connection.peerConnection.close());
      userSessionConnectionManager.current.peerConnections =
        userSessionConnectionManager.current.peerConnections.filter(
          (x) =>
            !connections.find((c) => c.peerConnectionId === x.peerConnectionId)
        );
      if (shouldNotify) {
        await serverConnection?.current?.invoke(
          'ConnectionsClosed',
          connections.map(({ peerConnectionId }) => peerConnectionId)
        );
      }
    }
  };

  const closeAndRemoveConnectionsFromUserSession = async (
    userSession: IUserSession,
    shouldNotify = false
  ) => {
    await closeAndRemoveConnections(
      userSessionConnectionManager.current.peerConnections.filter(
        (x) => x.userSessionId === userSession.id
      ),
      shouldNotify
    );
  };

  const removeMediasFromUserSession = (userSession: IUserSession) => {
    if (!userSession) return;
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
    setOtherScreenSharedStream(
      (oldOtherScreenSharedStream: IUserSessionMediaStream | undefined) => {
        if (
          oldOtherScreenSharedStream &&
          oldOtherScreenSharedStream.userSessionId === userSession.id
        )
          return undefined;
        return oldOtherScreenSharedStream;
      }
    );
  };

  const updateUserSession = (userSession: IUserSession) => {
    if (!userSession) return;
    setUserSessions((oldUserSessions: IUserSession[]) => {
      const updateUserSessions = oldUserSessions.map((oldUserSession) => {
        if (oldUserSession.id === userSession.id) {
          userSession.isSelf = oldUserSession.isSelf;
          if (userSession.isSelf) {
            selfUserSession.current = userSession;
          }
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
            sessionConnection.peerConnectionId ===
            userSessionConnection.peerConnectionId
          ) {
            return userSessionConnection;
          }
          return sessionConnection;
        }
      );
  };

  const updateUserSessionAudioVolumes = (
    userSession: IUserSession,
    volume: number
  ) => {
    setUserSessionAudioVolumes((oldUserSessionAudioVolumes) => {
      return oldUserSessionAudioVolumes.map((oldUserSessionVolume) => {
        const matched = oldUserSessionAudioVolumes.find(
          (x) => x.userSessionId === userSession.id
        );
        if (matched) {
          matched.volume = volume;
          return matched;
        }
        return oldUserSessionVolume;
      });
    });
  };

  const removeUserSession = async (userSession: IUserSession) => {
    if (!userSession) return;
    setUserSessions((oldUserSessions: IUserSession[]) =>
      oldUserSessions.filter(
        (oldUserSession: IUserSession) => oldUserSession.id !== userSession.id
      )
    );
    removeMediasFromUserSession(userSession);
    await closeAndRemoveConnectionsFromUserSession(userSession);
  };

  const changeAudio = async (userSessionId: string, muted: boolean) => {
    const changeAudioCommand: ChangeAudioCommand = {
      userSessionId,
      isMuted: muted,
    };
    await api.meeting.changeAudio(changeAudioCommand);
  };

  const setupSignalr = async (userName: string, meetingId: string) => {
    const wsUrl = `${Env.apiUrl}meetingHub?username=${userName}&meetingNumber=${meetingId}`;
    serverConnection.current = new HubConnectionBuilder()
      .withUrl(wsUrl, { accessTokenFactory: () => userStore.idToken })
      .withAutomaticReconnect()
      .build();
    serverConnection.current.onclose(() => {
      electron.remote.getCurrentWindow().reload();
    });
    serverConnection.current.onreconnected(() => {
      electron.remote.getCurrentWindow().reload();
    });
  };

  const connectSignrlr = async () => {
    const startSignalrConnection = async () => {
      try {
        await serverConnection.current?.start();
        setSignalrConnected(true);
      } catch (error) {
        if (error?.statusCode === 401) {
          electron.remote.getCurrentWindow().close();
        }
        setTimeout(async () => {
          await startSignalrConnection();
        }, 5000);
      }
    };
    await startSignalrConnection();
  };

  const setupSignalrHubMethodHandlers = () => {
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

    serverConnection?.current?.on(
      'OtherJoined',
      async (otherUserSession: IUserSession) => {
        otherUserSession.isSelf = false;
        setUserSessions((oldUserSessions: IUserSession[]) => {
          if (oldUserSessions.find((x) => x.id === otherUserSession.id))
            return oldUserSessions;
          return [...oldUserSessions, otherUserSession];
        });
        await connectToOtherUserIfRequire(otherUserSession);
      }
    );

    serverConnection?.current?.on(
      'OtherLeft',
      async (otherUser: IUserSession) => {
        await removeUserSession(otherUser);
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
      'OtherOfferSent',
      async (
        sendFromUserSession: IUserSession,
        offerPeerConnectionMediaType: IUserRTCPeerConnectionMediaType,
        offerPeerConnectionId: string,
        offerToJson: string
      ) => {
        if (selfUserSession.current) {
          await createAnswerPeerConnection(
            selfUserSession.current,
            sendFromUserSession,
            offerPeerConnectionMediaType,
            offerPeerConnectionId,
            JSON.parse(offerToJson)
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
          const candidate = JSON.parse(candidateToJson);
          if (candidate) {
            await matchedPeerConnection.peerConnection.addIceCandidate(
              candidate
            );
          }
        } else {
          await serverConnection?.current?.invoke(
            'ConnectionNotFoundWhenOtherIceSent',
            selfUserSession.current,
            peerConnectionId,
            candidateToJson
          );
        }
      }
    );

    serverConnection?.current?.on(
      'OtherConnectionsClosed',
      async (peerConnectionIds: string[]) => {
        const matchedPeerConnections =
          userSessionConnectionManager.current.peerConnections.filter((x) =>
            peerConnectionIds.find(
              (peerConnectionId) =>
                x.peerConnectionId === peerConnectionId ||
                x.relatedPeerConnectionId === peerConnectionId
            )
          );
        await closeAndRemoveConnections(matchedPeerConnections, false);
      }
    );
  };

  const createOfferPeerConnection = async (
    sendFromUserSession: IUserSession,
    sendToUserSession: IUserSession,
    streamToSend: MediaStream,
    mediaType: IUserRTCPeerConnectionMediaType
  ) => {
    // Prevent send or receive accour exception
    if (!sendFromUserSession.connectionId || !sendToUserSession.connectionId)
      return;

    const peerConnectionId = GUID();
    const peerConnection = new RTCPeerConnection({
      iceServers: iceServers.current,
    });
    const peerConnectionType = IUserRTCPeerConnectionType.offer;

    bindPeerConnectionEventListener(
      peerConnection,
      peerConnectionId,
      sendToUserSession,
      mediaType
    );

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
      peerConnectionMediaType: mediaType,
      peerConnectionType,
      peerConnectionId,
      peerConnection,
    });

    await serverConnection?.current?.invoke(
      'ProcessOffer',
      sendFromUserSession,
      sendToUserSession,
      mediaType,
      peerConnectionId,
      JSON.stringify(offer)
    );
  };

  const createAnswerPeerConnection = async (
    sendFromUserSession: IUserSession,
    sendToUserSession: IUserSession,
    offerPeerConnectionMediaType: IUserRTCPeerConnectionMediaType,
    offerPeerConnectionId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    const peerConnectionId = GUID();
    const peerConnection = new RTCPeerConnection({
      iceServers: iceServers.current,
    });
    const peerConnectionType = IUserRTCPeerConnectionType.answer;

    bindPeerConnectionEventListener(
      peerConnection,
      peerConnectionId,
      sendToUserSession,
      offerPeerConnectionMediaType
    );

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    userSessionConnectionManager.current.peerConnections.push({
      userSessionId: sendToUserSession.id,
      peerConnectionMediaType: offerPeerConnectionMediaType,
      peerConnectionType,
      peerConnectionId,
      peerConnection,
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
    mediaType: IUserRTCPeerConnectionMediaType
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
        trackingAudioVolume(sendToUserSession, stream);
        setUserSessionAudios(
          (oldUserSessionAudios: IUserSessionMediaStream[]) => {
            return [
              ...oldUserSessionAudios,
              {
                userSessionId: sendToUserSession.id,
                stream,
              },
            ];
          }
        );
        setUserSessionAudioVolumes(
          (oldUserSessionAudioVolumes: IUserSessionMediaStreamVolume[]) => {
            return [
              ...oldUserSessionAudioVolumes,
              {
                userSessionId: sendToUserSession.id,
                volume: 0,
              },
            ];
          }
        );
      } else if (e.track.kind === 'video') {
        if (mediaType === IUserRTCPeerConnectionMediaType.screen) {
          setOtherScreenSharedStream(() => {
            return {
              userSessionId: sendToUserSession.id,
              stream,
            };
          });
        } else if (mediaType === IUserRTCPeerConnectionMediaType.video) {
          setUserSessionVideos(
            (oldUserSessionVideos: IUserSessionMediaStream[]) => {
              return [
                ...oldUserSessionVideos,
                {
                  userSessionId: sendToUserSession.id,
                  stream,
                },
              ];
            }
          );
        }
      }
    });
  };

  const trackingAudioVolume = async (
    userSession: IUserSession,
    trackAudioStream: MediaStream
  ) => {
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule('./utils/vumeter.js');
    const source = audioContext.createMediaStreamSource(trackAudioStream);
    const node = new AudioWorkletNode(audioContext, 'vumeter');
    node.port.onmessage = (event) => {
      if (event.data.volume) {
        updateUserSessionAudioVolumes(
          userSession,
          Math.round(event.data.volume * 200)
        );
      }
    };
    source.connect(node).connect(audioContext.destination);
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
        userSessionAudioVolumes,
        isSharingVideo,
        setIsSharingVideo,
        currentScreenId,
        setCurrentScreenId,
        isSelectingScreen,
        setIsSelectingScreen,
        userSessionVideos,
        otherScreenSharedStream,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
