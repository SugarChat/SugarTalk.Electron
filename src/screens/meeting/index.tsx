import React from 'react';
import { Box } from '@material-ui/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import electron from 'electron';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { WebRTC } from './components/web-rtc';
import { useStores } from '../../contexts/root-context';
import { MeetingContext, MeetingProvider } from './context';
import Env from '../../config/env';

interface IUserSession {
  id: string;
  userName: string;
  isSelf: boolean;
}

interface IUser {
  id: string;
  userName: string;
}

// TODO: temp meeting info
const username = 'tom';
const meetingNumber = '35507';

const MeetingScreen: React.FC = () => {
  const location = useLocation();

  const { userStore } = useStores();

  const serverRef = React.useRef<HubConnection>();

  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

  const { setVideo, setVoice } = React.useContext(MeetingContext);

  const createUserSession = (user: IUser, isSelf: boolean) => {
    const userSession: IUserSession = {
      id: user.id,
      userName: user.userName,
      isSelf,
    };

    setUserSessions((oldUserSessions: IUserSession[]) => [
      ...oldUserSessions,
      userSession,
    ]);
  };

  const removeUserSession = (id: string) => {
    setUserSessions((oldUserSessions: IUserSession[]) =>
      oldUserSessions.filter(
        (userSession: IUserSession) => userSession.id !== id
      )
    );
  };

  const onCloseMeeting = () => {
    electron.remote.getCurrentWindow().close();
  };

  const onFullScreen = () => {
    const currentWindow = electron.remote.getCurrentWindow();
    if (currentWindow.fullScreen) {
      currentWindow.setFullScreen(false);
    } else {
      currentWindow.setFullScreen(true);
    }
  };

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

    serverRef.current.on('SetLocalUser', (localUser: IUser) => {
      createUserSession(localUser, true);
    });

    serverRef.current.on('SetOtherUsers', (otherUsers: IUser[]) => {
      otherUsers.forEach((user: IUser) => {
        createUserSession(user, false);
      });
    });

    serverRef.current.on('OtherJoined', (otherUser: IUser) => {
      createUserSession(otherUser, false);
    });

    serverRef.current.on('OtherLeft', (connectionId: string) => {
      removeUserSession(connectionId);
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
    <PageScreen style={styles.root}>
      <StatusBar onFullScreen={() => onFullScreen()} />
      <Box style={styles.webRTCContainer}>
        {userSessions.map((userSession, key) => {
          return (
            <WebRTC
              key={key.toString()}
              serverRef={serverRef}
              id={userSession.id}
              userName={userSession.userName}
              isSelf={userSession.isSelf}
            />
          );
        })}
      </Box>
      <FooterToolbar onCloseMeeting={() => onCloseMeeting()} />
    </PageScreen>
  );
};

export const Meeting = () => (
  <MeetingProvider>
    <MeetingScreen />
  </MeetingProvider>
);
