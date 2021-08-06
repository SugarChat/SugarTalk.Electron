import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@material-ui/core';
import electron from 'electron';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { Header } from '../../components/header';
import * as styles from './styles';
import { createMeetingWindow } from '../meeting-util';

export interface MeetingInfo {
  meetingId: string;
  userName: string;
  connectedWithAudio: boolean;
  connectedWithVideo: boolean;
}

export const JoinMeeting: React.FC = () => {
  const history = useHistory();

  const defaultMeetingInfo: MeetingInfo = {
    meetingId: '',
    userName: '',
    connectedWithAudio: true,
    connectedWithVideo: false,
  };

  const [meetingInfo, setMeetingInfo] = useState(defaultMeetingInfo);

  const onJoinClick = () => {
    const meetingInfoQuery = queryString.stringify(meetingInfo);

    const currentWindow = electron.remote.getCurrentWindow();

    currentWindow.hide();

    createMeetingWindow(currentWindow, meetingInfoQuery);
  };

  const onBackClick = () => {
    history.goBack();
  };

  const onMeetingIdChanged = (meetingId: string) => {
    const thisMeetingInfo = {
      ...meetingInfo,
      meetingId,
    };
    setMeetingInfo(thisMeetingInfo);
  };

  const onUserNameChanged = (userName: string) => {
    const thisMeetingInfo = {
      ...meetingInfo,
      userName,
    };
    setMeetingInfo(thisMeetingInfo);
  };

  const onAudioToggle = () => {
    const thisMeetingInfo = {
      ...meetingInfo,
      connectedWithAudio: !meetingInfo.connectedWithAudio,
    };
    setMeetingInfo(thisMeetingInfo);
  };

  const onCameraToggle = () => {
    const thisMeetingInfo = {
      ...meetingInfo,
      connectedWithVideo: !meetingInfo.connectedWithVideo,
    };
    setMeetingInfo(thisMeetingInfo);
  };

  return (
    <div style={styles.root}>
      <Header title="加入会议" />
      <form style={styles.content} noValidate autoComplete="off">
        <div style={styles.contentItem}>
          <TextField
            label="会议号"
            variant="outlined"
            fullWidth
            value={meetingInfo.meetingId}
            onChange={(e) => onMeetingIdChanged(e.target.value)}
          />
        </div>
        <div style={styles.contentItem}>
          <TextField
            label="你的名称"
            variant="outlined"
            fullWidth
            value={meetingInfo.userName}
            onChange={(e) => onUserNameChanged(e.target.value)}
          />
        </div>
        <div style={styles.contentItem}>
          <FormControlLabel
            control={
              <Checkbox
                checked={meetingInfo.connectedWithAudio}
                onChange={onAudioToggle}
                name="checkedB"
                color="primary"
              />
            }
            label="自动连接音频"
          />
        </div>
        {/* <div style={styles.contentItem}>
          <FormControlLabel
            control={
              <Checkbox
                checked={meetingInfo.connectedWithVideo}
                onChange={onCameraToggle}
                name="checkedB"
                color="primary"
              />
            }
            label="入会开启摄像头"
          />
        </div> */}
        <div style={styles.joinButtonWrapper}>
          <Button
            style={{ width: '100%', height: '40px' }}
            variant="contained"
            color="primary"
            disableElevation
            onClick={onJoinClick}
          >
            加入会议
          </Button>
          <Button
            style={{ width: '100%', height: '40px', marginTop: '10px' }}
            variant="contained"
            color="primary"
            disableElevation
            onClick={onBackClick}
          >
            返回
          </Button>
        </div>
      </form>
    </div>
  );
};
