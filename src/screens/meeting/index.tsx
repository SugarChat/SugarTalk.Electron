import React from 'react';
import { Box } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { MeetingContext, MeetingProvider } from './context';
import { VerticalUserList } from './components/vertical-user-list';

const MeetingScreen: React.FC = React.memo(() => {
  const {
    userSessions,
    userSessionAudios,
    userSessionVideos,
    currentScreenId,
    isMuted,
  } = React.useContext(MeetingContext);

  const isSomeoneElseSharingScreenOrCamera = userSessions.some(
    (x) => x.isSharingScreen || x.isSharingCamera
  );

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer}>
        {isSomeoneElseSharingScreenOrCamera && (
          <Box style={styles.sharingRootContainer}>
            <Box style={styles.sharingContainer}>
              {userSessionVideos?.map((userSessionVideo, key) => {
                return (
                  <Box key={key.toString()}>
                    {userSessionVideo.stream && (
                      <video
                        ref={(video) => {
                          if (video) video.srcObject = userSessionVideo.stream;
                        }}
                        autoPlay
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box style={styles.verticalUserListContainer}>
              <VerticalUserList />
            </Box>
          </Box>
        )}
        {!isSomeoneElseSharingScreenOrCamera && (
          <Box style={styles.sharingRootContainer}>
            <VerticalUserList />
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
