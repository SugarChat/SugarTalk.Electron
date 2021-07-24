import React from 'react';
import { Box } from '@material-ui/core';
import { ipcRenderer } from 'electron';
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

  const userSessionsRef = React.useRef<any>({});

  const [ipRendererBound, setipRendererBound] = React.useState<boolean>(false);

  const { serverConnection, setScreenSharingId, screenSharingId } =
    React.useContext(MeetingContext);

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
      (connectionId: string, answerSDP: string) => {
        console.log(connectionId, 'parent recv ProcessAnswer event');
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onProcessAnswer(answerSDP);
        }
      }
    );

    serverConnection?.current?.on(
      'NewOfferCreated',
      (connectionId: string, _answerSDP) => {
        console.log(connectionId, 'parent recv NewOfferCreated event');
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onNewOfferCreated();
        }
      }
    );

    serverConnection?.current?.on(
      'AddCandidate',
      (connectionId: string, candidate: string) => {
        console.log(connectionId, 'parent recv AddCandidate event');
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onAddCandidate(candidate);
        }
      }
    );
  }, [serverConnection?.current]);

  React.useEffect(() => {
    if (!ipRendererBound) {
      ipcRenderer.on(
        'share-screen-selected',
        async (_e: any, screenId: string) => {
          setScreenSharingId(screenId);
          console.log(screenId);
        }
      );
      setipRendererBound(true);
    }
  }, [screenSharingId]);

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer}>
        {userSessions.map((userSession, key) => {
          return (
            <WebRTC
              ref={(ref) => {
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

      <FooterToolbar />
    </PageScreen>
  );
};

export const Meeting = () => (
  <MeetingProvider>
    <MeetingScreen />
  </MeetingProvider>
);
