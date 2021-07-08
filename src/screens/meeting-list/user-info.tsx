import React from 'react';
import { useHistory } from 'react-router-dom';
import { Avatar } from '@material-ui/core';
import * as styles from './user-info-styles';

export const UserInfo = () => {
  const history = useHistory();
  return (
    <div style={styles.root}>
      <div>
        <div>
          <Avatar src="./images/head.png" style={styles.head} />
          <span style={styles.userName}>berton</span>
        </div>
      </div>
    </div>
  );
};
