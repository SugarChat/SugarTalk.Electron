import { Box } from '@material-ui/core';
import React, { useMemo } from 'react';
import { MeetingContext } from '../../context';
import * as styles from './style';

export const ScreenSharing = () => {
  const { screenStream } = React.useContext(MeetingContext);
  return useMemo(() => {
    return (
      <Box style={styles.screenSharingRoot}>
        {screenStream && (
          <video
            style={styles.video}
            ref={(video) => {
              if (video) video.srcObject = screenStream;
            }}
            autoPlay
          />
        )}
      </Box>
    );
  }, [screenStream]);
};
