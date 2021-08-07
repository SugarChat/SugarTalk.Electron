import { Avatar, Box, List, ListItem } from '@material-ui/core';
import React from 'react';
import { IUserSession } from '../../../../dtos/schedule-meeting-command';

import * as styles from './styles';

interface VerticalUserListProps {
  userSessions: IUserSession[];
}

export const VerticalUserList = (props: VerticalUserListProps) => {
  return (
    <List component="nav">
      {props.userSessions.map((userSession, key) => {
        return (
          <ListItem key={key}>
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
