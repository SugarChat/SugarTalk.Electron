import React from 'react';
import { useHistory } from 'react-router-dom';
import Pseudo from 'react-dom-pseudo';
import * as styles from './button-styles';
import logo from './images/begin.png';

export const BeginMeeting = () => {
  const history = useHistory();
  return (
    <Pseudo hoverStyle={styles.hoverStyle} style={styles.button}>
      <img src={logo} style={styles.img} alt="" />
      <span style={styles.text}>快速会议</span>
    </Pseudo>
  );
};
