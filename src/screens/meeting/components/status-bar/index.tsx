import React from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import SignalCellularAltIcon from '@material-ui/icons/SignalCellularAlt';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import styles from './index.scss';

interface IStatusBar {
  duration: string;
}

const StatusBar = (props: IStatusBar) => {
  const { duration } = props;

  return (
    <Box className={styles.root}>
      <Grid
        container
        direction="row"
        alignItems="center"
        className={styles.statusBarContainer}
      >
        <Grid
          container
          item
          xs={6}
          direction="row"
          alignItems="center"
          justify="flex-start"
        >
          <Box component="span" className={styles.statusBarButton}>
            <InfoIcon fontSize="inherit" htmlColor="#5e6166" />
          </Box>
          <Box component="span" className={styles.statusBarButton}>
            <VerifiedUserIcon fontSize="inherit" htmlColor="#006fff" />
          </Box>
          <Box component="span" className={styles.statusBarButton}>
            <SignalCellularAltIcon fontSize="inherit" htmlColor="#00cc66" />
          </Box>
        </Grid>
        <Grid
          container
          item
          xs={6}
          direction="row"
          alignItems="center"
          justify="flex-end"
        >
          <Box component="span" className={styles.statusBarTimer}>
            <Typography className={styles.statusBarTimerText}>
              {duration}
            </Typography>
          </Box>
          <Box component="span" className={styles.statusBarButton}>
            <FullscreenIcon fontSize="inherit" htmlColor="#76787d" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default React.memo(StatusBar);
