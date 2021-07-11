import React from 'react';
import { Box } from '@material-ui/core';
import electron from 'electron';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { WebRTC } from './components/web-rtc';
import { MeetingContext, MeetingProvider } from './context';

interface IUserSession {
  id: string;
  userName: string;
  isSelf: boolean;
}

interface IUser {
  id: string;
  userName: string;
}

const MeetingScreen: React.FC = () => {
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

  const { serverRef } = React.useContext(MeetingContext);

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
    serverRef?.current?.on('SetLocalUser', (localUser: IUser) => {
      createUserSession(localUser, true);
    });

    serverRef?.current?.on('SetOtherUsers', (otherUsers: IUser[]) => {
      otherUsers.forEach((user: IUser) => {
        createUserSession(user, false);
      });
    });

    serverRef?.current?.on('OtherJoined', (otherUser: IUser) => {
      createUserSession(otherUser, false);
    });

    serverRef?.current?.on('OtherLeft', (connectionId: string) => {
      removeUserSession(connectionId);
    });
  }, [serverRef?.current]);

  return (
    <PageScreen style={styles.root}>
      <StatusBar onFullScreen={() => onFullScreen()} />
      <Box style={styles.webRTCContainer}>
        {userSessions.map((userSession, key) => {
          return (
            <WebRTC
              key={key.toString()}
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
