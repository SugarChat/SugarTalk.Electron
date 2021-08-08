import { Avatar, Box } from '@material-ui/core';
import React from 'react';
import { IUserSession } from '../../../../dtos/schedule-meeting-command';

import * as styles from './styles';

interface UserCardProps {
  isSelf: boolean;
  userSession: IUserSession;
}

export const UserCard = (props: UserCardProps) => {
  const audioSrc = props.isSelf
    ? ''
    : (props.userSession.sendOnlyPeerConnection
        ?.getSenders()
        .find((x) => x.track?.kind === 'audio') as RTCRtpSender);
  if (audioSrc) {
  }

  console.log('----usercard----', props.userSession.userName, audioSrc);
  return (
    <Box component="div" style={styles.userContainer}>
      <Avatar src={props.userSession.userPicture} style={styles.avatar} />
      <Box component="div" style={styles.userName}>
        {props.userSession.userName}
      </Box>
      {/* {!props.isSelf && <audio src={audioSrc} autoPlay muted={!props.isSelf} />} */}
    </Box>
  );
};
