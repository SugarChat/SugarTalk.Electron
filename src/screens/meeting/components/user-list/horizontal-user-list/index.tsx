import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import { green } from '@material-ui/core/colors';
import { Avatar, Box, List, ListItem } from '@material-ui/core';
import React, { useMemo } from 'react';
import * as styles from './styles';
import { MeetingContext } from '../../../context';

export const HorizontalUserList = () => {
  const { userSessions } = React.useContext(MeetingContext);
  return useMemo(() => {
    return (
      <List component="div" style={styles.listRoot}>
        {userSessions.map((userSession, key) => {
          return (
            <ListItem key={key.toString()} style={styles.listItem}>
              <Box component="div" style={styles.userContainer}>
                <Avatar src={userSession.userPicture} style={styles.avatar} />
                <Box component="div" style={styles.userNameContainer}>
                  <Box component="p">{userSession.userName}</Box>
                  {!userSession.isMuted ? (
                    <MicIcon fontSize="small" style={{ color: green[500] }} />
                  ) : (
                    <MicOffIcon fontSize="small" color="disabled" />
                  )}
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>
    );
  }, [userSessions]);
};
