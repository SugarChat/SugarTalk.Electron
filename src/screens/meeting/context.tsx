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
  serverConnection:
    | React.MutableRefObject<HubConnection | undefined>
    | undefined;
  meetingNumber: string;
  audio: boolean;
  setAudio: React.Dispatch<React.SetStateAction<boolean>>;
  video: boolean;
  setVideo: React.Dispatch<React.SetStateAction<boolean>>;
  screen: boolean;
  setScreen: React.Dispatch<React.SetStateAction<boolean>>;
  screenSelecting: boolean;
  setScreenSelecting: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MeetingContext = React.createContext<IMeetingContextValue>({
  serverConnection: undefined,
  meetingNumber: '',
  audio: false,
  setAudio: () => {},
  video: false,
  setVideo: () => {},
  screen: false,
  setScreen: () => {},
  screenSelecting: false,
  setScreenSelecting: () => {},
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [audio, setAudio] = React.useState<boolean>(false);
  const [video, setVideo] = React.useState<boolean>(false);
  const [screen, setScreen] = React.useState<boolean>(false);
  const [screenSelecting, setScreenSelecting] = React.useState<boolean>(false);
  const [meetingNumber, setMeetingNumber] = React.useState<string>('');
  const serverConnection = React.useRef<HubConnection>();
  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    const meetingInfo = queryString.parse(location.search, {
      parseBooleans: true,
    }) as unknown as IMeetingInfo;

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

    return () => {
      serverConnection.current?.stop();
    };
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        serverConnection,
        meetingNumber,
        audio,
        setAudio,
        video,
        setVideo,
        screen,
        setScreen,
        screenSelecting,
        setScreenSelecting,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
