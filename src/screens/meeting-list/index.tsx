import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Settings } from '@material-ui/icons';
import { Button } from '@material-ui/core';
import { scheduleMeeting } from '../../services/api/meetingApi';
import styles from './index.scss';
import { Header } from '../../components/header';

export const MeetingList = (params: RouteComponentProps) => {
  console.log(params.location.state);

  const joinMeeting = () => {
    params.history.push('/join');
  };

  const onScheduleMeetingClicked = async () => {
    const meetingInfo = await scheduleMeeting();
    console.log(meetingInfo);
  };

  return (
    <div className={styles.root}>
      <Header title="SugarTalk" />
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
