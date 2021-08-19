import React from 'react';
import { Box } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { MeetingContext, MeetingProvider } from './context';
import { ScreenSharing } from './components/screen-sharing';
import { VerticalUserList } from './components/user-list/vertical-user-list';
import { HorizontalUserList } from './components/user-list/horizontal-user-list';

const MeetingScreen: React.FC = React.memo(() => {
  const { userSessions, userSessionAudios } = React.useContext(MeetingContext);

  const isSomeoneElseSharingScreen = userSessions.some(
    (x) => x.isSharingScreen && !x.isSelf
  );

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer}>
        {isSomeoneElseSharingScreen && (
          <Box style={styles.sharingRootContainer}>
            <Box style={styles.sharingContainer}>
              <ScreenSharing />
            </Box>
            <Box style={styles.verticalUserListContainer}>
              <VerticalUserList />
            </Box>
          </Box>
        )}
        {!isSomeoneElseSharingScreen && (
          <Box style={styles.horizontalUserListContainer}>
            <HorizontalUserList />
          </Box>
        )}
      </Box>
      {userSessionAudios?.map((userSessionAudio, key) => {
        return (
          <Box key={key.toString()}>
            {userSessionAudio.stream && (
              <audio
                ref={(audio) => {
                  if (audio) audio.srcObject = userSessionAudio.stream;
                }}
                autoPlay
              />
            )}
          </Box>
        );
      })}
      <FooterToolbar />
    </PageScreen>
  );
});

export const Meeting = () => (
  <MeetingProvider>
    <MeetingScreen />
  </MeetingProvider>
);
