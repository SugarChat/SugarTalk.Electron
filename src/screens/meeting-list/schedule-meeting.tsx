import React from 'react';
import { useHistory } from 'react-router-dom';
import Pseudo from 'react-dom-pseudo';
import * as styles from './button-styles';
import logo from './images/schedule.png';

export const ScheduleMeeting = () => {
  const history = useHistory();
  return (
    <Pseudo hoverStyle={styles.hoverStyle} style={styles.button}>
      <img src={logo} alt="" />
      <span style={styles.text}>预定会议</span>
    </Pseudo>
  );
};
