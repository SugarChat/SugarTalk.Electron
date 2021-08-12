import React from 'react';
import { Box } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { MeetingContext, MeetingProvider } from './context';
import { VerticalUserList } from './components/vertical-user-list';

const MeetingScreen: React.FC = React.memo(() => {
  const { isMuted, setIsMuted, userSessions, userSessionAudios } =
    React.useContext(MeetingContext);

  const isSomeoneSharingScreenOrCamera = userSessions.some(
    (x) => x.isSharingScreen || x.isSharingCamera
  );

  const toggleAudio = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {};

  const toggleScreen = (screenId?: string) => {};

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer}>
        {isSomeoneSharingScreenOrCamera && (
          <Box style={styles.sharingRootContainer}>
            <Box style={styles.sharingContainer}>
              <video></video>
            </Box>
            <Box style={styles.verticalUserListContainer}>
              <VerticalUserList />
            </Box>
          </Box>
        )}
        {!isSomeoneSharingScreenOrCamera && (
          <Box style={styles.sharingRootContainer}>
            <VerticalUserList />
          </Box>
        )}
      </Box>
      {userSessionAudios?.map((userSessionAudio, key) => {
        return (
          <Box key={key.toString()}>
            {userSessionAudio.audioStream && (
              <audio
                ref={(audio) => {
                  if (audio) audio.srcObject = userSessionAudio.audioStream;
                }}
                autoPlay
              />
            )}
          </Box>
        );
      })}
      <FooterToolbar
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        toggleScreen={toggleScreen}
      />
    </PageScreen>
  );
});

export const Meeting = () => (
  <MeetingProvider>
    <MeetingScreen />
  </MeetingProvider>
);
