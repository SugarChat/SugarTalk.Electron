import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Divider } from '@material-ui/core';
import Api from '../../services/api';
import { Header } from '../../components/header';
import { PageScreen } from '../../components/page-screen';
import { useStores } from '../../contexts/root-context';
import queryString from 'query-string';
import { createMeetingWindow } from '../meeting-util';
import {
  MeetingType,
  ScheduleMeetingCommand,
} from '../../dtos/schedule-meeting-command';
import { Guid } from 'guid-typescript';
import electron from 'electron';
import { MeetingInfo } from '../join-meeting';
import { BaseStoreInstance } from '../../contexts/setup-store';

export const MeetingList = () => {
  const history = useHistory();
  const { dispatch, userStore } = useStores();

  const joinMeeting = () => {
    history.push('/JoinMeeting');
  };

  const logout = () => {
    dispatch({
      type: 'UpdateIdToken',
      payload: '',
    });
    dispatch({
      type: 'UpdateUserInfo',
      payload: BaseStoreInstance,
    });
  };

  const onScheduleMeetingClicked = async () => {};

  const onCreateAdHocMeetingClicked = async () => {
    const meetingInfo = await createMeetingInternal(MeetingType.adHoc);

    console.log(meetingInfo);

    if (meetingInfo) {
      const meetingInfoQuery = queryString.stringify(meetingInfo);

      const currentWindow = electron.remote.getCurrentWindow();

      currentWindow.hide();

      createMeetingWindow(currentWindow, meetingInfoQuery);
    }
  };

  const createMeetingInternal = async (
    meetingType: MeetingType
  ): Promise<MeetingInfo> => {
    const scheduleCommand: ScheduleMeetingCommand = {
      id: Guid.create().toString(),
      meetingType,
    };

    const meetingDto = await Api.meeting.scheduleMeeting(scheduleCommand);

    return {
      meetingId: meetingDto.data.meetingNumber,
      userName: userStore.userInfo.name,
      connectedWithAudio: true,
      connectedWithVideo: false,
    };
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
        onClick={onCreateAdHocMeetingClicked}
        fullWidth
        disableElevation
      >
        快速会议
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
