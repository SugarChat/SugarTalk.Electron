import { Box, Grid, IconButton } from '@material-ui/core';
import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import SignalCellularAltIcon from '@material-ui/icons/SignalCellularAlt';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import * as styles from './styles';

interface IStatusBar {
  onFullScreen: () => void;
}

export const StatusBar = (props: IStatusBar) => {
  const { onFullScreen } = props;

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
        justify="flex-start"
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
        justify="flex-end"
        spacing={1}
      >
        {/* <Grid item>
          <Box style={styles.statusBarTimer}>25:49:25</Box>
        </Grid> */}
        <Grid item>
          <IconButton size="small" onClick={() => onFullScreen()}>
            <FullscreenIcon fontSize="small" htmlColor="#76787d" />
          </IconButton>
        </Grid>
      </Grid>
    </Grid>
  );
};
