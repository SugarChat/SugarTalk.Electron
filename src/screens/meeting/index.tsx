import React from 'react';
import { Box } from '@material-ui/core';
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
  sdp: string;
  offerIndex: number;
  newIceCandidate: string;
  candidateIndex: number;
}

interface IUser {
  id: string;
  userName: string;
}

const MeetingScreen: React.FC = () => {
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

  const [ipRendererBound, setipRendererBound] = React.useState<boolean>(false);

  const {
    serverConnection,
    cameraEnabled,
    setScreenSharingId,
    screenSharingId,
  } = React.useContext(MeetingContext);

  const createUserSession = (user: IUser, isSelf: boolean) => {
    const userSession: IUserSession = {
      id: user.id,
      userName: user.userName,
      isSelf,
      sdp: '',
      offerIndex: 0,
      newIceCandidate: '',
      candidateIndex: 0,
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
      (connectionId, answerSDP: string) => {
        const target = userSessions.find((x) => x.id === connectionId);
        if (target) {
          target.sdp = answerSDP;
          setUserSessions([...userSessions]);
        }
      }
    );

    serverConnection?.current?.on('NewOfferCreated', (connectionId, _) => {
      const target = userSessions.find((x) => x.id === connectionId);
      if (target) {
        target.offerIndex += 1;
        setUserSessions([...userSessions]);
      }
    });

    serverConnection?.current?.on('AddCandidate', (connectionId, candidate) => {
      const target = userSessions.find((x) => x.id === connectionId);
      if (target) {
        target.candidateIndex += 1;
        target.newIceCandidate = candidate;
        setUserSessions([...userSessions]);
      }
    });
  }, [serverConnection?.current]);

  React.useEffect(() => {
    if (!ipRendererBound) {
      const ipcRenderer = require('electron').ipcRenderer;
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
              key={key.toString()}
              id={userSession.id}
              userName={userSession.userName}
              isSelf={userSession.isSelf}
              cameraEnabled={cameraEnabled}
              sdp={userSession.sdp}
              offerIndex={userSession.offerIndex}
              candidateIndex={userSession.candidateIndex}
              newCandidate={userSession.newIceCandidate}
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
