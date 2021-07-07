import { Box, Button, Grid, withStyles } from '@material-ui/core';
import React from 'react';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import * as styles from './styles';

interface IToolbarButton {
  text: string;
  icon: React.ReactElement;
}

const ToolbarButton = (props: IToolbarButton) => {
  const { text, icon } = props;

  const CButton = withStyles({
    root: {
      color: '#47494d',
    },
  })(Button);

  return (
    <CButton size="small">
      <Grid container direction="column" justify="center">
        <Grid item>{icon}</Grid>
        <Grid item>{text}</Grid>
      </Grid>
    </CButton>
  );
};

export const FooterToolbar = () => {
  return (
    <Box style={styles.footerToolbarContainer}>
      <Grid container direction="row">
        <Grid item container xs={6} justify="flex-start" spacing={1}>
          <Grid item>
            <ToolbarButton text="声音" icon={<MicIcon />} />
          </Grid>
          <Grid item>
            <ToolbarButton text="视频" icon={<VideocamIcon />} />
          </Grid>
        </Grid>
        <Grid item container xs={6} justify="flex-end" spacing={3}>
          <Grid item>
            <Button variant="outlined" color="secondary">
              结束会议
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
