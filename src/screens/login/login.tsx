import React from 'react';
import styles from './index.scss';
import { Settings } from '@material-ui/icons';
import { Header } from '../../components/header';
import logo from './images/logo.jpg';
import { Avatar, Button } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';

const images = require('../../../assets/icon.png');
export const Login = ({ history }: RouteComponentProps) => {
  const onLoginClick = () => {
    history.push('/meeting-list');
  };

  return (
    <div className={styles.root}>
      <Header title="腾讯会议"></Header>
      <div className={styles.settingWrapper}>
        <Settings style={{ color: '#333', width: '25px', height: '25px' }} />
      </div>
      <div className={styles.content}>
        <img src={logo} alt="" />

        <Button
          style={{ width: '100%', height: '40px' }}
          variant="contained"
          color="primary"
          disableElevation
          onClick={onLoginClick}
        >
          加入会议
        </Button>

        <Button
          style={{
            color: '#2196F3',
            marginTop: '20px',
            width: '100%',
            height: '40px',
          }}
          variant="outlined"
        >
          注册/登录
        </Button>

        <div className={styles.otherLogin}>
          <div className={styles.text}>其他登录方式</div>
          <div className={styles.line}></div>
        </div>

        <div className={styles.otherLoginButtonsWrapper}>
          <div className={styles.buttonWrapper}>
            <Avatar src={images} style={{ width: '40px', height: '40px' }} />
            <div className={styles.buttonText}>Wechat</div>
          </div>
          <div className={styles.buttonWrapper}>
            <Avatar src={images} style={{ width: '40px', height: '40px' }} />
            <div className={styles.buttonText}>Google</div>
          </div>
          <div className={styles.buttonWrapper}>
            <Avatar src={images} style={{ width: '40px', height: '40px' }} />
            <div className={styles.buttonText}>Facebook</div>
          </div>
        </div>
      </div>
    </div>
  );
};
