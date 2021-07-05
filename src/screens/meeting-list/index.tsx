import React from 'react';
import styles from './index.scss';
import { RouteComponentProps } from 'react-router-dom';
import { Header } from '../../components/header';
import { Settings } from '@material-ui/icons';
import { Button } from '@material-ui/core';
import { scheduleMeeting } from '../../services/api/meetingApi';

export const MeetingList = ({ history }: RouteComponentProps) => {
  const joinMeeting = () => {
    history.push('/join');
  };

  const onScheduleMeetingClicked = async () => {
    const meetingInfo = await scheduleMeeting();
    console.log(meetingInfo);
  };

  return (
    <div className={styles.root}>
      <Header title="SugarTalk"></Header>
      <div className={styles.settingWrapper}>
        <Settings style={{ color: '#333', width: '25px', height: '25px' }} />
      </div>
      <div className={styles.content}>
        <Button onClick={() => history.goBack()}>Back</Button>
        <Button onClick={joinMeeting}>加入会议</Button>
        <Button onClick={onScheduleMeetingClicked}>快速会议</Button>
      </div>
    </div>
  );
};
