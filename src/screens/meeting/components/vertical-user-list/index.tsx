import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import { green } from '@material-ui/core/colors';
import { Avatar, Box, List, ListItem } from '@material-ui/core';
import React, { useMemo } from 'react';
import { MeetingContext } from '../../context';

import * as styles from './styles';

interface UserLitsProps {
  isSharing?: boolean;
}

export const VerticalUserList: React.FC<UserLitsProps> = ({ isSharing }) => {
  const { userSessions } = React.useContext(MeetingContext);
  return useMemo(() => {
    return (
      <List component="div" style={styles.root(isSharing || false)}>
        {userSessions.map((userSession, key) => {
          return (
            <ListItem key={key} style={styles.listItem(isSharing || false)}>
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
    );
  }, [userSessions]);
};
