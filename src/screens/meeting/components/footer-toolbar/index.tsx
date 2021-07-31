import { Box, Button, Grid, withStyles, ButtonProps } from '@material-ui/core';
import React from 'react';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import electron, { ipcRenderer } from 'electron';
import * as styles from './styles';
import { MeetingContext } from '../../context';

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

interface IFooterToolBar {
  toggleVideo: () => void;
  toggleScreen: (screenId?: string) => void;
}

export const FooterToolbar = React.memo((props: IFooterToolBar) => {
  const { toggleVideo, toggleScreen } = props;

  const { audio, video, screen } = React.useContext(MeetingContext);

  React.useEffect(() => {
    const onShareScreenSelected = (_e: unknown, screenId: string) => {
      toggleScreen(screenId);
    };

    ipcRenderer.on('share-screen-selected', onShareScreenSelected);

    return () => {
      ipcRenderer.removeListener(
        'share-screen-selected',
        onShareScreenSelected
      );
    };
  }, [toggleScreen]);

  const onCloseMeeting = () => {
    electron.remote.getCurrentWindow().close();
  };

  const showScreenSelector = () => {
    const selectorWindow = new electron.remote.BrowserWindow({
      show: true,
      width: 880,
      height: 620,
      movable: true,
      modal: true,
      focusable: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      },
    });

    selectorWindow.on('blur', () => {
      selectorWindow.focus();
    });

    const currentWindow = electron.remote.getCurrentWindow();
    selectorWindow.setParentWindow(currentWindow);
    selectorWindow.loadURL(`file://${__dirname}/index.html#/ScreenSelector`);
  };

  const onShareScreen = () => {
    if (screen) {
      toggleScreen();
    } else {
      showScreenSelector();
    }
  };

  return (
    <Box style={styles.footerToolbarContainer}>
      <Grid container direction="row">
        <Grid item container xs={6} justifyContent="flex-start" spacing={1}>
          <Grid item>
            <ToolbarButton
              onClick={() => undefined}
              text={audio ? '静音' : '解除静音'}
              icon={audio ? <MicIcon /> : <MicOffIcon />}
            />
          </Grid>
          <Grid item>
            <ToolbarButton
              onClick={toggleVideo}
              text={video ? '关闭视频' : '开启视频'}
              icon={video ? <VideocamIcon /> : <VideocamOffIcon />}
            />
          </Grid>
          <Grid item>
            <ToolbarButton
              onClick={onShareScreen}
              text={screen ? '停止共享屏幕' : '共享屏幕'}
              icon={screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
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
              结束会议
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
});
