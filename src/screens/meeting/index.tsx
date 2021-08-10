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
import { UserCard } from './components/user-card';
import { GUID } from '../../utils/guid';

interface IUser {
  id: string;
  connectionId: string;
  userName: string;
  userPicture: string;
}

const MeetingScreen: React.FC = React.memo(() => {
  const { serverConnection, meetingNumber, userSessions } =
    React.useContext(MeetingContext);

  const toggleVideo = () => {};

  const toggleScreen = (screenId?: string) => {
    // if (selfUserSession) {
    //   userSessionsRef.current[selfUserSession.connectionId].toggleScreen(
    //     screenId
    //   );
    // }
  };

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer}>
        {userSessions.map((userSession, key) => {
          return (
            <Box key={GUID()}>
              <UserCard
                key={key.toString()}
                userSession={userSession}
                isSelf={
                  serverConnection?.current?.connectionId ===
                  userSession.connectionId
                }
              />
              {userSession.audioStream && !userSession.isSelf && (
                <audio
                  ref={(audio) => {
                    if (audio) audio.srcObject = userSession.audioStream;
                  }}
                  autoPlay
                />
              )}
            </Box>
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
