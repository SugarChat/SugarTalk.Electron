import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import { green } from '@material-ui/core/colors';
import { Avatar, Box, List, ListItem } from '@material-ui/core';
import React, { useMemo } from 'react';
import { MeetingContext } from '../../context';

import * as styles from './styles';
import { IUserSession } from '../../../../dtos/schedule-meeting-command';

interface UserLitsProps {
  isSharing?: boolean;
}

export const VerticalUserList: React.FC<UserLitsProps> = ({ isSharing }) => {
  const { userSessions, userSessionAudioVolumes } =
    React.useContext(MeetingContext);
  const isSpeaking = (userSession: IUserSession) => {
    const oneSessionAudioVolume = userSessionAudioVolumes.find(
      (x) => x.userSessionId === userSession.id
    );
    return oneSessionAudioVolume && oneSessionAudioVolume?.volume > 10;
  };

  const renderSpeakingPeople = useMemo(() => {
    return (
      !isSharing && (
        <Box style={styles.speakingWrapper}>
          <Box style={styles.speakingTitle}>正在讲话:</Box>
          {userSessionAudioVolumes.map((x, key) => {
            return x.volume > 10 ? (
              <Box key={key} style={styles.namesText}>
                {x.userSessionName};
              </Box>
            ) : null;
          })}
        </Box>
      )
    );
  }, [isSharing, userSessionAudioVolumes]);

  return useMemo(() => {
    return (
      <>
        {renderSpeakingPeople}
        <List component="div" style={styles.root(isSharing || false)}>
          {userSessions.map((userSession, key) => {
            return (
              <ListItem
                key={key}
                style={styles.listItem(
                  isSharing || false,
                  isSpeaking(userSession) || false
                )}
              >
                <Box component="div" style={styles.userContainer}>
                  <Avatar src={userSession.userPicture} style={styles.avatar} />
                  <Box
                    component="div"
                    style={styles.userNameContainer(isSharing || false)}
                  >
                    {userSession.isSharingScreen && (
                      <ScreenShareIcon fontSize="small" />
                    )}
                    {!userSession.isMuted ? (
                      <MicIcon fontSize="small" style={{ color: green[500] }} />
                    ) : (
                      <MicOffIcon
                        fontSize="small"
                        style={{ color: isSharing ? '#fff' : 'gray' }}
                      />
                    )}
                    <Box component="p">{userSession.userName}</Box>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </>
    );
  }, [userSessions, userSessionAudioVolumes]);
};
