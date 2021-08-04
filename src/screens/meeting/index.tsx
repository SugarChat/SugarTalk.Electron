import React from 'react';
import { Box } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { IWebRTCRef, WebRTC } from './components/web-rtc';
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

const MeetingScreen: React.FC = React.memo(() => {
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

  const userSessionsRef = React.useRef<Record<string, IWebRTCRef>>({});

  const { serverConnection } = React.useContext(MeetingContext);

  const selfUserSession = React.useMemo(() => {
    return userSessions.find((userSession) => userSession.isSelf === true);
  }, [userSessions]);

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
    serverConnection?.current?.on('SetLocalUser', (localUser: IUser) => {
      createUserSession(localUser, true);
    });

    serverConnection?.current?.on('SetOtherUsers', (otherUsers: IUser[]) => {
      otherUsers.forEach((user: IUser) => {
        createUserSession(user, false);
      });
    });

    serverConnection?.current?.on('OtherJoined', (otherUser: IUser) => {
      createUserSession(otherUser, false);
    });

    serverConnection?.current?.on('OtherLeft', (connectionId: string) => {
      removeUserSession(connectionId);
    });

    serverConnection?.current?.on(
      'ProcessAnswer',
      (
        connectionId: string,
        answerSDP: string,
        isSharingCamera: boolean,
        isSharingScreen: boolean
      ) => {
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onProcessAnswer(
            connectionId,
            answerSDP,
            isSharingCamera,
            isSharingScreen
          );
        }
      }
    );

    serverConnection?.current?.on(
      'NewOfferCreated',
      (connectionId: string, answerSDP: string) => {
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onNewOfferCreated(
            connectionId,
            answerSDP
          );
        }
      }
    );

    serverConnection?.current?.on(
      'AddCandidate',
      (connectionId: string, candidate: string) => {
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onAddCandidate(
            connectionId,
            candidate
          );
        }
      }
    );
  }, [serverConnection?.current]);

  const toggleVideo = () => {
    if (selfUserSession) {
      userSessionsRef.current[selfUserSession.id].toggleVideo();
    }
  };

  const toggleScreen = (screenId?: string) => {
    if (selfUserSession) {
      userSessionsRef.current[selfUserSession.id].toggleScreen(screenId);
    }
  };

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer}>
        {userSessions.map((userSession, key) => {
          return (
            <WebRTC
              ref={(ref: IWebRTCRef) => {
                userSessionsRef.current[userSession.id] = ref;
              }}
              key={key.toString()}
              id={userSession.id}
              userName={userSession.userName}
              isSelf={userSession.isSelf}
            />
          );
        })}
      </Box>

      <FooterToolbar toggleVideo={toggleVideo} toggleScreen={toggleScreen} />
    </PageScreen>
  );
});

export const Meeting = () => (
  <MeetingProvider>
    <MeetingScreen />
  </MeetingProvider>
);
