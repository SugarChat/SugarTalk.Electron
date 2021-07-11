import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import React from 'react';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import electron from 'electron';
import Env from '../../config/env';
import { useStores } from '../../contexts/root-context';

interface IMeetingContextValue {
  video: boolean;
  setVideo: React.Dispatch<React.SetStateAction<boolean>>;
  voice: boolean;
  setVoice: React.Dispatch<React.SetStateAction<boolean>>;
  serverRef: React.MutableRefObject<HubConnection | undefined> | undefined;
}

export const MeetingContext = React.createContext<IMeetingContextValue>({
  video: true,
  setVideo: () => {},
  voice: true,
  setVoice: () => {},
  serverRef: undefined,
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [video, setVideo] = React.useState<boolean>(true);
  const [voice, setVoice] = React.useState<boolean>(true);
  const serverRef = React.useRef<HubConnection>();
  const location = useLocation();
  const { userStore } = useStores();

  React.useEffect(() => {
    const meetingInfo = queryString.parse(location.search, {
      parseBooleans: true,
    });

    setVideo(meetingInfo.connectedWithVideo as boolean);
    setVoice(meetingInfo.connectedWithAudio as boolean);

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
        voice,
        setVoice,
        serverRef,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
