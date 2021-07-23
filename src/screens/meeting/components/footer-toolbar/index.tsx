import { Box, Button, Grid, withStyles, ButtonProps } from '@material-ui/core';
import React from 'react';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import electron from 'electron';
import * as styles from './styles';
import { MeetingContext } from '../../context';
import { getMediaDeviceAccessAndStatus } from '../../../../utils/media';

interface IToolbarButton extends ButtonProps {
  text: string;
  icon: React.ReactElement;
}

const ToolbarButton = (props: IToolbarButton) => {
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
};

export const FooterToolbar = () => {
  const { cameraEnabled, toggleCamera, microphoneEnabled, toggleMicrophone } =
    React.useContext(MeetingContext);

  const toggleVideo = async () => {
    if (cameraEnabled) {
      toggleCamera(false);
    } else {
      const status = await getMediaDeviceAccessAndStatus('camera', true);
      toggleCamera(status);
    }
  };

  const toggleVoice = async () => {
    if (microphoneEnabled) {
      toggleMicrophone(false);
    } else {
      const status = await getMediaDeviceAccessAndStatus('microphone', true);
      toggleMicrophone(status);
    }
  };

  const onCloseMeeting = () => {
    electron.remote.getCurrentWindow().close();
  };

  const onShareScreenClicked = () => {
    const meetingWindow = new electron.remote.BrowserWindow({
      show: true,
      width: 880,
      height: 620,
      movable: true,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      },
    });

    const currentWindow = electron.remote.getCurrentWindow();
    meetingWindow.setParentWindow(currentWindow);
    meetingWindow.loadURL(`file://${__dirname}/index.html#/ScreenSelector`);
  };

  return (
    <Box style={styles.footerToolbarContainer}>
      <Grid container direction="row">
        <Grid item container xs={6} justifyContent="flex-start" spacing={1}>
          <Grid item>
            <ToolbarButton
              onClick={toggleVoice}
              text={microphoneEnabled ? '静音' : '解除静音'}
              icon={microphoneEnabled ? <MicIcon /> : <MicOffIcon />}
            />
          </Grid>
          <Grid item>
            <ToolbarButton
              onClick={toggleVideo}
              text={cameraEnabled ? '关闭视频' : '开启视频'}
              icon={cameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            />
          </Grid>
          <Grid item>
            <ToolbarButton
              onClick={onShareScreenClicked}
              text="共享屏幕"
              icon={<ScreenShareIcon />}
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
};
