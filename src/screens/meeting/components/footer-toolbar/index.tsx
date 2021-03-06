import { Box, Button, Grid, withStyles, ButtonProps } from '@material-ui/core';
import React, { useMemo } from 'react';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import electron, { ipcRenderer } from 'electron';
import * as styles from './styles';
import { MeetingContext } from '../../context';
import { getMediaDeviceAccessAndStatus } from '../../../../utils/media';

interface IToolbarButton extends ButtonProps {
  text: string;
  icon: React.ReactElement;
}

const ToolbarButton = React.memo((props: IToolbarButton) => {
  const { text, icon, ...rest } = props;

  const CButton = withStyles({
    root: {
      color: '#47494d',
    },
  })(Button);

  return (
    <CButton size="small" {...rest}>
      <Grid container direction="column" justifyContent="center">
        <Grid item>{icon}</Grid>
        <Grid item>{text}</Grid>
      </Grid>
    </CButton>
  );
});

export const FooterToolbar = React.memo(() => {
  const {
    isMuted,
    currentScreenId,
    isSharingVideo,
    isSelectingScreen,
    userSessions,
    setIsMuted,
    setCurrentScreenId,
    setIsSelectingScreen,
    setIsSharingVideo,
  } = React.useContext(MeetingContext);

  const otherUserSharingScreen = userSessions.some(
    (x) => x.isSharingScreen && !x.isSelf
  );

  const isSharingScreen = userSessions.find((x) => x.isSelf)?.isSharingScreen;

  React.useEffect(() => {
    const onShareScreenSelected = (_e: unknown, screenId: string) => {
      setCurrentScreenId(screenId);
      setIsSelectingScreen(false);
    };

    ipcRenderer.on('share-screen-selected', onShareScreenSelected);

    return () => {
      ipcRenderer.removeListener(
        'share-screen-selected',
        onShareScreenSelected
      );
    };
  }, [setCurrentScreenId]);

  const onCloseMeeting = () => {
    electron.remote.getCurrentWindow().close();
  };

  const showScreenSelector = () => {
    const currentWindow = electron.remote.getCurrentWindow();
    const selectorWindow = new electron.remote.BrowserWindow({
      show: true,
      width: 880,
      height: 620,
      movable: true,
      modal: true,
      parent: currentWindow,
      focusable: true,
      resizable: false,
      minimizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    });
    selectorWindow.loadURL(`file://${__dirname}/index.html#/ScreenSelector`);
  };

  const onShareScreen = () => {
    if (currentScreenId) {
      setCurrentScreenId('');
    } else {
      setIsSelectingScreen(true);
      showScreenSelector();
    }
  };

  const onVideoClick = async () => {
    const status = await getMediaDeviceAccessAndStatus('camera', true);
    if (status) {
      setIsSharingVideo(!isSharingVideo);
    }
  };

  const renderContext = useMemo(() => {
    return (
      <Box style={styles.footerToolbarContainer}>
        <Grid container direction="row">
          <Grid item container xs={6} justifyContent="flex-start" spacing={1}>
            <Grid item>
              <ToolbarButton
                onClick={() => setIsMuted(!isMuted)}
                text={!isMuted ? '??????' : '????????????'}
                icon={!isMuted ? <MicIcon /> : <MicOffIcon />}
              />
            </Grid>
            <Grid item>
              <ToolbarButton
                onClick={onVideoClick}
                text={isSharingVideo ? '????????????' : '????????????'}
                icon={isSharingVideo ? <VideocamIcon /> : <VideocamOffIcon />}
              />
            </Grid>
            <Grid item>
              <ToolbarButton
                disabled={isSelectingScreen || otherUserSharingScreen}
                onClick={onShareScreen}
                text={!isSharingScreen ? '????????????' : '??????????????????'}
                icon={
                  isSharingScreen ? (
                    <StopScreenShareIcon />
                  ) : (
                    <ScreenShareIcon />
                  )
                }
              />
            </Grid>
          </Grid>
          <Grid item container xs={6} justifyContent="flex-end" spacing={3}>
            <Grid item>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onCloseMeeting}
              >
                ????????????
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  }, [
    isMuted,
    currentScreenId,
    isSharingVideo,
    isSelectingScreen,
    isSharingScreen,
    otherUserSharingScreen,
  ]);

  return renderContext;
});
