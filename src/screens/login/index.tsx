import React, { FunctionComponent } from 'react';
import { Settings } from '@material-ui/icons';
import { Avatar, Button } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Header } from '../../components/header';
import logo from './images/logo.jpg';
import * as styles from './styles';
import { useLoginLogic } from './hook';
import { PageScreen } from '../../components/page-screen/index';
import { useStores } from '../../contexts/index';

export const Login: FunctionComponent = () => {
  const { userStore } = useStores();
  const { onLogin } = useLoginLogic();
  const history = useHistory();
  const onLoginClick = () => {
    if (userStore.idToken) {
      history.push('/MeetingList');
    }
  };

  return (
    <PageScreen>
      <Header title="SugarTalk" />
      <div style={styles.settingWrapper}>
        <Settings style={styles.settings} />
      </div>
      <div style={styles.content}>
        <img src={logo} alt="" />
        <Button
          style={styles.joinMeeting}
          variant="contained"
          color="primary"
          disableElevation
          onClick={() => {
            onLoginClick();
          }}
        >
          加入会议
        </Button>

        <Button style={styles.login} variant="outlined">
          注册/登录
        </Button>

        <div style={styles.otherLogin}>
          <div style={styles.otherLoginText}>其他登录方式</div>
          <div style={styles.line} />
        </div>

        <div style={styles.otherLoginButtonsWrapper}>
          <div style={styles.buttonWrapper} onClick={() => onLogin('wechat')}>
            <Avatar src="../assets/login/wechat.png" style={styles.images} />
            <div style={styles.buttonText}>Wechat</div>
          </div>
          <div style={styles.buttonWrapper} onClick={() => onLogin('google')}>
            <Avatar src="../assets/login/google.png" style={styles.images} />
            <div style={styles.buttonText}>Google</div>
          </div>
          <div style={styles.buttonWrapper} onClick={() => onLogin('facebook')}>
            <Avatar src="../assets/login/facebook.png" style={styles.images} />
            <div style={styles.buttonText}>Facebook</div>
          </div>
        </div>
      </div>
    </PageScreen>
  );
};
