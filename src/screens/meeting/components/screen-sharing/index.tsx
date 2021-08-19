import { Box } from '@material-ui/core';
import React, { useMemo } from 'react';
import { MeetingContext } from '../../context';

export const ScreenSharing = () => {
  const { userSessionVideos } = React.useContext(MeetingContext);
  return useMemo(() => {
    return (
      <Box>
        {userSessionVideos?.map((userSessionVideo, key) => {
          return (
            <Box key={key.toString()}>
              {userSessionVideo.stream && (
                <video
                  style={{ width: '95%' }}
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
