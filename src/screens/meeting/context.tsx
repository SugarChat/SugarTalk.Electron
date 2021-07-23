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

export interface IMeetingInfo {
  meetingId: string;
  userName: string;
  connectedWithAudio: boolean;
  connectedWithVideo: boolean;
}

interface IMeetingContextValue {
  toggleCamera: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMicrophone: React.Dispatch<React.SetStateAction<boolean>>;
  setScreenSharingId: (screenId: string) => void;
  setCurrentConnectionId: (connectionId: string) => void;
  serverConnection:
    | React.MutableRefObject<HubConnection | undefined>
    | undefined;
  hasVideo: boolean;
  hasAudio: boolean;
  meetingNumber: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharingId: string;
  currentConnectionId: string;
}

export const MeetingContext = React.createContext<IMeetingContextValue>({
  toggleCamera: () => {},
  toggleMicrophone: () => {},
  setScreenSharingId: (screenId: string) => {},
  setCurrentConnectionId: (connectionId: string) => {},
  serverConnection: undefined,
  hasVideo: false,
  hasAudio: false,
  meetingNumber: '',
  cameraEnabled: false,
  microphoneEnabled: false,
  screenSharingId: '',
  currentConnectionId: '',
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [cameraEnabled, toggleCamera] = React.useState<boolean>(true);
  const [microphoneEnabled, toggleMicrophone] = React.useState<boolean>(true);
  const [screenSharingId, setScreenSharingId] = React.useState<string>('');

  const [hasVideo, setHasVideo] = React.useState<boolean>(true);
  const [hasAudio, setHasAudio] = React.useState<boolean>(true);
  const [meetingNumber, setMeetingNumber] = React.useState<string>('');
  const serverConnection = React.useRef<HubConnection>();
  const [currentConnectionId, setCurrentConnectionId] =
    React.useState<string>('');

  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    const meetingInfo = queryString.parse(location.search, {
      parseBooleans: true,
    }) as unknown as IMeetingInfo;

    const initMediaDeviceStatus = async () => {
      const hasCamera = await getMediaDeviceAccessAndStatus('camera');
      const hasMicrophone = await getMediaDeviceAccessAndStatus('microphone');

      if (hasCamera === false && hasMicrophone === false) {
        showRequestMediaAccessDialog();
        electron.remote.getCurrentWindow().close();
      }

      setHasVideo(hasCamera);
      setHasAudio(hasMicrophone);

      toggleCamera((meetingInfo.connectedWithVideo as boolean) && hasCamera);
      toggleMicrophone(
        (meetingInfo.connectedWithAudio as boolean) && hasMicrophone
      );
    };

    initMediaDeviceStatus();

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

    return () => {
      serverConnection.current?.stop();
    };
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        toggleCamera,
        toggleMicrophone,
        setScreenSharingId,
        setCurrentConnectionId,
        serverConnection,
        hasVideo,
        hasAudio,
        meetingNumber,
        cameraEnabled,
        microphoneEnabled,
        screenSharingId,
        currentConnectionId,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
