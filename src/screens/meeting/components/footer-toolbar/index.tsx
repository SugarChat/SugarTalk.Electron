import { Box, Button, Grid, withStyles, ButtonProps } from '@material-ui/core';
import React from 'react';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import electron from 'electron';
import * as styles from './styles';
import { MeetingContext } from '../../context';
import { getMediaAccessStatus } from '../../../../utils/media';

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
      <Grid container direction="column" justify="center">
        <Grid item>{icon}</Grid>
        <Grid item>{text}</Grid>
      </Grid>
    </CButton>
  );
};

export const FooterToolbar = () => {
  const { video, setVideo, voice, setVoice } = React.useContext(MeetingContext);

  const toggleVideo = async () => {
    if (video) {
      setVideo(false);
    } else {
      const status = await getMediaAccessStatus('camera', true);
      setVideo(status);
    }
  };

  const toggleVoice = async () => {
    if (voice) {
      setVoice(false);
    } else {
      const status = await getMediaAccessStatus('microphone', true);
      setVoice(status);
    }
  };

  const onCloseMeeting = () => {
    electron.remote.getCurrentWindow().close();
  };

  return (
    <Box style={styles.footerToolbarContainer}>
      <Grid container direction="row">
        <Grid item container xs={6} justify="flex-start" spacing={1}>
          <Grid item>
            <ToolbarButton
              onClick={toggleVoice}
              text={voice ? '静音' : '解除静音'}
              icon={voice ? <MicIcon /> : <MicOffIcon />}
            />
          </Grid>
          <Grid item>
            <ToolbarButton
              onClick={toggleVideo}
              text={video ? '关闭视频' : '开启视频'}
              icon={video ? <VideocamIcon /> : <VideocamOffIcon />}
            />
          </Grid>
        </Grid>
        <Grid item container xs={6} justify="flex-end" spacing={3}>
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
