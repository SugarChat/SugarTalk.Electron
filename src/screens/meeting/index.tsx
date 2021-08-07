import React from 'react';
import { Box } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { IWebRTCRef, WebRTC } from './components/web-rtc';
import { MeetingContext, MeetingProvider } from './context';
import { VerticalUserList } from './components/vertical-user-list';
import Api from '../../services/api';

export interface IUserSession {
  id: string;
  connectionId: string;
  userName: string;
  isSelf: boolean;
  userPicture: string;
  isSharingScreen: boolean;
  isSharingCamera: boolean;
}

interface IUser {
  id: string;
  connectionId: string;
  userName: string;
  userPicture: string;
}

const MeetingScreen: React.FC = React.memo(() => {
  const [userSessions, setUserSessions] = React.useState<IUserSession[]>([]);

  const userSessionsRef = React.useRef<Record<string, IWebRTCRef>>({});

  const { serverConnection, meetingNumber } = React.useContext(MeetingContext);

  const selfUserSession = React.useMemo(() => {
    return userSessions.find((userSession) => userSession.isSelf === true);
  }, [userSessions]);

  const createUserSession = (user: IUser, isSelf: boolean) => {
    const userSession: IUserSession = {
      id: user.id,
      connectionId: user.connectionId,
      userName: user.userName,
      isSelf,
      userPicture: user.userPicture,
      isSharingCamera: false,
      isSharingScreen: false,
    };

    setUserSessions((oldUserSessions: IUserSession[]) => [
      ...oldUserSessions,
      userSession,
    ]);
  };

  const removeUserSession = (connectionId: string) => {
    setUserSessions((oldUserSessions: IUserSession[]) =>
      oldUserSessions.filter(
        (userSession: IUserSession) => userSession.connectionId !== connectionId
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
      async (
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

        console.log('----process answer----');
      }
    );

    serverConnection?.current?.on(
      'NewOfferCreated',
      async (
        connectionId: string,
        answerSDP: string,
        isSharingCamera: boolean,
        isSharingScreen: boolean
      ) => {
        console.log('----new answer----');

        const meetingSessionDto = await Api.meeting.getMeetingSession({
          meetingNumber,
        });

        console.log(meetingSessionDto);
        if (userSessionsRef.current[connectionId]) {
          userSessionsRef.current[connectionId].onNewOfferCreated(
            connectionId,
            answerSDP,
            isSharingCamera,
            isSharingScreen
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
      userSessionsRef.current[selfUserSession.connectionId].toggleVideo();
    }
  };

  const toggleScreen = (screenId?: string) => {
    if (selfUserSession) {
      userSessionsRef.current[selfUserSession.connectionId].toggleScreen(
        screenId
      );
    }
  };

  const userThatShowingVideo = userSessions.find(
    (x) => x.isSharingCamera || x.isSharingScreen
  );

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      {!userThatShowingVideo && (
        <Box style={styles.webRTCContainer}>
          {userSessions.map((userSession, key) => {
            return (
              <WebRTC
                ref={(ref: IWebRTCRef) => {
                  userSessionsRef.current[userSession.connectionId] = ref;
                }}
                key={key.toString()}
                userSession={userSession}
                isSelf={userSession.isSelf}
              />
            );
          })}
        </Box>
      )}

      {userThatShowingVideo && (
        <Box style={styles.sharingRootContainer}>
          <Box style={styles.sharingContainer}>
            <WebRTC
              ref={(ref: IWebRTCRef) => {
                userSessionsRef.current[userThatShowingVideo.connectionId] =
                  ref;
              }}
              userSession={userThatShowingVideo}
              isSelf={userThatShowingVideo.isSelf}
            />
          </Box>
          <Box style={styles.verticalUserList}>
            <VerticalUserList userSessions={userSessions}></VerticalUserList>
          </Box>
        </Box>
      )}

      <FooterToolbar toggleVideo={toggleVideo} toggleScreen={toggleScreen} />
    </PageScreen>
  );
});

export const Meeting = () => (
  <MeetingProvider>
    <MeetingScreen />
  </MeetingProvider>
);
