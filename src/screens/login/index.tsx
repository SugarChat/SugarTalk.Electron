import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Settings } from '@material-ui/icons';
import { Avatar } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import logo from './images/logo.jpg';
import * as styles from './styles';
import { useLoginLogic } from './hook';
import { PageScreen } from '../../components/page-screen/index';
import { useStores } from '../../contexts/root-context';
import { Loading } from '../../components/loading/index';

export const Login: FunctionComponent = () => {
  const { userStore } = useStores();
  const { onLogin, loginPlatformList } = useLoginLogic();
  const history = useHistory();

  useEffect(() => {
    if (userStore.idToken) {
      history.replace('/MeetingList');
    }
  }, [userStore?.idToken, history]);

  const renderLoginItem = useMemo(() => {
    return loginPlatformList.map((x) => (
      <div
        key={x.loginType}
        style={styles.buttonWrapper}
        onClick={() =>
          onLogin({
            loginType: x.loginType,
            onSuccess: x.onSuccess,
          })
        }
      >
        <Avatar src={x.imageSrc} style={styles.images} />
        <div style={styles.buttonText}>{x.loginType}</div>
      </div>
    ));
  }, [loginPlatformList, onLogin]);

  return (
    <PageScreen>
      <div style={styles.settingWrapper}>
        <Settings style={styles.settings} />
      </div>
      <div style={styles.content}>
        <img src={logo} alt="" />

        <div style={styles.otherLogin}>
          <div style={styles.otherLoginText}>登录方式</div>
          <div style={styles.line} />
        </div>

        <div style={styles.otherLoginButtonsWrapper}>{renderLoginItem}</div>
      </div>
    </PageScreen>
  );
};
