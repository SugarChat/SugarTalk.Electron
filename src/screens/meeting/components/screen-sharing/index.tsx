import { Box } from '@material-ui/core';
import React, { useMemo } from 'react';
import { MeetingContext } from '../../context';

export const ScreenSharing = () => {
  const { userSessionVideos } = React.useContext(MeetingContext);
  return useMemo(() => {
    return (
      <Box style={{ height: '100%' }}>
        {userSessionVideos?.map((userSessionVideo, key) => {
          return (
            <Box key={key.toString()} style={{ height: '100%' }}>
              {userSessionVideo.stream && (
                <video
                  style={{ height: '100%' }}
                  ref={(video) => {
                    if (video) video.srcObject = userSessionVideo.stream;
                  }}
                  autoPlay
                />
              )}
            </Box>
          );
        })}
      </Box>
    );
  }, [userSessionVideos]);
};
