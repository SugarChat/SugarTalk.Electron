import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import electron from 'electron';
import Env from '../../config/env';
import { useStores } from '../../contexts/root-context';
import {
  getMediaDeviceAccess,
  getMediaDeviceStatus,
  showRequestMediaAccessDialog,
} from '../../utils/media';

interface IMeetingContextValue {
  video: boolean;
  setVideo: React.Dispatch<React.SetStateAction<boolean>>;
  audio: boolean;
  setAudio: React.Dispatch<React.SetStateAction<boolean>>;
  serverRef: React.MutableRefObject<HubConnection | undefined> | undefined;
  hasVideo: boolean;
  hasAudio: boolean;
}

export const MeetingContext = React.createContext<IMeetingContextValue>({
  video: false,
  setVideo: () => {},
  audio: false,
  setAudio: () => {},
  serverRef: undefined,
  hasVideo: false,
  hasAudio: false,
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [video, setVideo] = React.useState<boolean>(true);
  const [audio, setAudio] = React.useState<boolean>(true);
  const [hasVideo, setHasVideo] = React.useState<boolean>(true);
  const [hasAudio, setHasAudio] = React.useState<boolean>(true);
  const serverRef = React.useRef<HubConnection>();
  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    const meetingInfo = queryString.parse(location.search, {
      parseBooleans: true,
    });

    console.log(meetingInfo);

    const initMediaDeviceStatus = async () => {
      const videoDeviceStatus =
        (await getMediaDeviceStatus('camera')) &&
        (await getMediaDeviceAccess('camera'));
      const audioDeviceStatus =
        (await getMediaDeviceStatus('microphone')) &&
        (await getMediaDeviceAccess('microphone'));

      if (videoDeviceStatus === false && audioDeviceStatus === false) {
        showRequestMediaAccessDialog();
        electron.remote.getCurrentWindow().close();
      }

      setHasVideo(videoDeviceStatus);
      setHasAudio(audioDeviceStatus);

      setVideo(
        (meetingInfo.connectedWithVideo as boolean) && videoDeviceStatus
      );
      setAudio(
        (meetingInfo.connectedWithAudio as boolean) && audioDeviceStatus
      );
    };

    initMediaDeviceStatus();

    const wsUrl = `${Env.apiUrl}meetingHub?username=${meetingInfo.userName}&meetingNumber=${meetingInfo.meetingId}`;

    serverRef.current = new HubConnectionBuilder()
      .withUrl(wsUrl, { accessTokenFactory: () => userStore.idToken })
      .build();

    serverRef.current.onclose((error?: Error) => {
      if (error?.message.includes('MeetingNotFoundException')) {
        alert('Meeting not found.');
        electron.remote.getCurrentWindow().close();
      }
    });

    serverRef.current.start().catch((error?: any) => {
      if (error?.statusCode === 401) {
        alert('Unauthorized.');
        electron.remote.getCurrentWindow().close();
      }
    });

    return () => {
      serverRef.current?.stop();
    };
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        video,
        setVideo,
        audio,
        setAudio,
        serverRef,
        hasVideo,
        hasAudio,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
