import React from 'react';
import styles from './index.scss';
import { RouteComponentProps } from 'react-router-dom';
import { Header } from '../../components/header';
import { Settings } from '@material-ui/icons';
import { Button } from '@material-ui/core';

export const MeetingList = ({ history }: RouteComponentProps) => {
  return (
    <div className={styles.root}>
      <Header></Header>
      <div className={styles.settingWrapper}>
        <Settings style={{ color: '#333', width: '25px', height: '25px' }} />
      </div>
      <div className={styles.content}>
        <Button onClick={() => history.goBack()}>Back</Button>
      </div>
    </div>
  );
};
