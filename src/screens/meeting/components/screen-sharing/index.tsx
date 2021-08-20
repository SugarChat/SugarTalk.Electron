import { Box } from '@material-ui/core';
import React, { useMemo } from 'react';
import { MeetingContext } from '../../context';

export const ScreenSharing = () => {
  const { screenStream } = React.useContext(MeetingContext);
  return useMemo(() => {
    return (
      <Box style={{ height: '100%' }}>
        {screenStream && (
          <video
            style={{ height: '100%' }}
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
