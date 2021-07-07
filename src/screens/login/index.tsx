import React, { FunctionComponent, useEffect } from 'react';
import { Settings } from '@material-ui/icons';
import { Avatar } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Header } from '../../components/header';
import logo from './images/logo.jpg';
import * as styles from './styles';
import { useLoginLogic } from './hook';
import { PageScreen } from '../../components/page-screen/index';
import { useStores } from '../../contexts/root-context';

export const Login: FunctionComponent = () => {
  const { userStore } = useStores();
  const { onLogin } = useLoginLogic();
  const history = useHistory();

  useEffect(() => {
    if (userStore.idToken) {
      history.replace('/MeetingList');
    }
  }, [userStore.idToken, history]);

  return (
    <PageScreen>
      <Header title="SugarTalk" />
      <div style={styles.settingWrapper}>
        <Settings style={styles.settings} />
      </div>
      <div style={styles.content}>
        <img src={logo} alt="" />

        <div style={styles.otherLogin}>
          <div style={styles.otherLoginText}>登录方式</div>
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
