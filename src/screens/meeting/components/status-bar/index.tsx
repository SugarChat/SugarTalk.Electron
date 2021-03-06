import { Box, Grid, IconButton } from '@material-ui/core';
import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import SignalCellularAltIcon from '@material-ui/icons/SignalCellularAlt';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import electron from 'electron';
import * as styles from './styles';
import { MeetingContext } from '../../context';
import { secondsToDateFormat } from '../../../../utils/datetime';

export const StatusBar = () => {
  const { meetingNumber } = React.useContext(MeetingContext);
  const [duration, setDuration] = React.useState<number>(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDuration((currentDuration: number) => currentDuration + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const onFullScreen = () => {
    const currentWindow = electron.remote.getCurrentWindow();
    if (currentWindow.fullScreen) {
      currentWindow.setFullScreen(false);
    } else {
      currentWindow.setFullScreen(true);
    }
  };

  return (
    <Grid
      container
      style={styles.statusBarContainer}
      direction="row"
      alignItems="center"
    >
      <Grid
        container
        item
        xs={6}
        direction="row"
        alignItems="center"
        justifyContent="flex-start"
        spacing={1}
      >
        <Grid item>
          <IconButton size="small" disabled>
            <InfoIcon fontSize="small" htmlColor="#5e6166" />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton size="small" disabled>
            <VerifiedUserIcon fontSize="small" htmlColor="#006fff" />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton size="small" disabled>
            <SignalCellularAltIcon fontSize="small" htmlColor="#00cc66" />
          </IconButton>
        </Grid>
      </Grid>
      <Grid
        container
        item
        xs={6}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={1}
      >
        <Grid item>
          <Box style={styles.roomNumber}>?????????: {meetingNumber}</Box>
        </Grid>
        <Grid item>
          <Box style={styles.statusBarTimer}>
            {secondsToDateFormat(duration)}
          </Box>
        </Grid>
        <Grid item>
          <IconButton size="small" onClick={onFullScreen}>
            <FullscreenIcon fontSize="small" htmlColor="#76787d" />
          </IconButton>
        </Grid>
      </Grid>
    </Grid>
  );
};
