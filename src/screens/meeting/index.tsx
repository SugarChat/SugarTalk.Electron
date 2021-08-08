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
import { IUserSession } from '../../dtos/schedule-meeting-command';

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
