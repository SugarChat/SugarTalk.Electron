import React, { useMemo } from 'react';
import { Box } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';
import { StatusBar } from './components/status-bar';
import * as styles from './styles';
import { FooterToolbar } from './components/footer-toolbar';
import { MeetingContext, MeetingProvider } from './context';
import { VerticalUserList } from './components/vertical-user-list';
import { ScreenSharing } from './components/screen-sharing';

const MeetingScreen: React.FC = React.memo(() => {
  const { userSessions, userSessionAudios } = React.useContext(MeetingContext);

  const isSomeoneElseSharingScreen = userSessions.some(
    (x) => x.isSharingScreen && !x.isSelf
  );

  const isSharing = useMemo(() => {
    return isSomeoneElseSharingScreen;
  }, [isSomeoneElseSharingScreen]);

  const renderSaringMetting = useMemo(() => {
    if (!isSomeoneElseSharingScreen) return null;
    return <ScreenSharing />;
  }, [isSomeoneElseSharingScreen]);

  return (
    <PageScreen style={styles.root}>
      <StatusBar />

      <Box style={styles.webRTCContainer(isSharing || false)}>
        <>
          {renderSaringMetting}
          <VerticalUserList isSharing={isSharing} />
        </>
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
