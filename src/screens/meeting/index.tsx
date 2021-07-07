import React from 'react';
import { Box } from '@material-ui/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { WebRTC } from './components/web-rtc';
import { useStores } from '../../contexts/root-context';
import { MeetingProvider } from './context';
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

export const Meeting: React.FC = () => {
  const { userStore } = useStores();

  const serverRef = React.useRef<HubConnection>();

  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

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

  React.useEffect(() => {
    const wsUrl = `${Env.apiUrl}meetingHub?username=${username}&meetingNumber=${meetingNumber}`;

    serverRef.current = new HubConnectionBuilder()
      .withUrl(wsUrl, { accessTokenFactory: () => userStore.idToken })
      .build();

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

    serverRef.current.start();

    return () => {
      serverRef.current?.stop();
    };
  }, []);

  return (
    <PageScreen style={styles.root}>
      <MeetingProvider>
        <StatusBar />
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
        <FooterToolbar />
      </MeetingProvider>
    </PageScreen>
  );
};
