import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Divider } from '@material-ui/core';
import Api from '../../services/api';
import { Header } from '../../components/header';
import { PageScreen } from '../../components/page-screen';
import { useStores } from '../../contexts/root-context';

export const MeetingList = () => {
  const history = useHistory();
  const { dispatch } = useStores();

  const joinMeeting = () => {
    history.push('/JoinMeeting');
  };

  const logout = () => {
    dispatch({
      type: 'UpdateIdToken',
      payload: '',
    });
  };

  const onScheduleMeetingClicked = async () => {
    const meetingInfo = await Api.meeting.scheduleMeeting((e) => {});
    console.log(meetingInfo);
  };

  return (
    <PageScreen>
      <Header title="SugarTalk" />
      <Button
        color="primary"
        variant="contained"
        onClick={joinMeeting}
        fullWidth
        disableElevation
      >
        加入会议
      </Button>
      <Divider />
      <Button
        color="primary"
        variant="contained"
        onClick={logout}
        fullWidth
        disableElevation
      >
        注销
      </Button>
    </PageScreen>
  );
};
