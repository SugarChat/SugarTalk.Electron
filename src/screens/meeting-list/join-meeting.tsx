import React from 'react';
import { useHistory } from 'react-router-dom';
import Pseudo from 'react-dom-pseudo';
import * as styles from './button-styles';
import logo from './images/join.png';

export const JoinMeeting = () => {
  const history = useHistory();
  const joinMeeting = () => {
    history.push('/join');
  };
  return (
    <Pseudo
      hoverStyle={styles.hoverStyle}
      style={styles.button}
      onClick={joinMeeting}
    >
      <img src={logo} alt="" />
      <span style={styles.text}>加入会议</span>
    </Pseudo>
  );
};
