import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@material-ui/core';
import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Header } from '../../components/header';
import * as styles from './styles';

export interface MeetingInfo {
  meetingId: string;
  userName: string;
  connectedWithAudio: boolean;
  connectedWithVideo: boolean;
}

export const JoinMeeting = ({ history }: RouteComponentProps) => {
  const onJoinClick = () => {};
  const onBackClick = () => {
    history.goBack();
  };

  const defaultMeetingInfo: MeetingInfo = {
    meetingId: '',
    userName: '',
    connectedWithAudio: true,
    connectedWithVideo: false,
  };

  const [meetingInfo, setMeetingInfo] = useState(defaultMeetingInfo);

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

  const startCapturing = () => {
    const { desktopCapturer } = require('electron');

    desktopCapturer
      .getSources({ types: ['window', 'screen'] })
      .then(async (sources: any) => {
        for (const source of sources) {
          console.log(source);
          if (source.name === 'Screen 2') {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
              });
              handleStream(stream);
            } catch (e) {
              handleError(e);
            }
            return;
          }
        }
      });
  };

  const handleStream = (stream: MediaProvider | null) => {
    console.log('-----video-----');
    const video = document.querySelector('video');
    if (video) {
      video.srcObject = stream;
      video.onloadedmetadata = (e) => video.play();
    }
  };

  const handleError = (e) => {
    console.log(e);
  };

  return (
    <div style={styles.root}>
      <Header title="加入会议"></Header>
      <form style={styles.content} noValidate autoComplete="off">
        <div style={styles.contentItem}>
          <TextField
            id="outlined-basic"
            label="会议号"
            variant="outlined"
            fullWidth={true}
            size="small"
            value={meetingInfo.meetingId}
            onChange={(e) => onMeetingIdChanged(e.target.value)}
          />
        </div>
        <div style={styles.contentItem}>
          <TextField
            id="outlined-basic2"
            label="你的名称"
            variant="outlined"
            fullWidth={true}
            size="small"
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
        <div style={styles.contentItem}>
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
        </div>
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
          <Button
            style={{ width: '100%', height: '40px', marginTop: '10px' }}
            variant="contained"
            color="primary"
            disableElevation
            onClick={startCapturing}
          >
            分享屏幕
          </Button>
        </div>
      </form>
    </div>
  );
};
