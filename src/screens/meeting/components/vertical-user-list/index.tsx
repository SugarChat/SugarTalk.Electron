import { Avatar, Box, List, ListItem } from '@material-ui/core';
import React from 'react';
import { MeetingContext } from '../../context';

import * as styles from './styles';

export const VerticalUserList = () => {
  const { userSessions } = React.useContext(MeetingContext);
  return (
    <List component="div" style={styles.root}>
      {userSessions.map((userSession, key) => {
        return (
          <ListItem key={key} style={styles.listItem}>
            <Box component="div" style={styles.userContainer}>
              <Avatar src={userSession.userPicture} style={styles.avatar} />
              <Box component="div" style={styles.userName}>
                {userSession.userName}
              </Box>
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
};
