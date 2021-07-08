import React from 'react';
import { useHistory } from 'react-router-dom';
import Pseudo from 'react-dom-pseudo';
import * as styles from './button-styles';
import logo from './images/setting.png';

export const Setting = () => {
  const history = useHistory();
  return (
    <Pseudo hoverStyle={styles.hoverStyle}>
      <img src={logo} alt="" />
    </Pseudo>
  );
};
