import { Avatar, Box } from '@material-ui/core';
import { useLockFn } from 'ahooks';
import React from 'react';
import { IUserSession } from '../..';
import { MeetingContext } from '../../context';
import * as styles from './styles';

interface IWebRTC {
  userSession: IUserSession;
  isSelf: boolean;
}

export interface IWebRTCRef {
  onProcessAnswer: (
    connectionId: string,
    answerSDP: string,
    isSharingCamera: boolean,
    isSharingScreen: boolean
  ) => void;
  onAddCandidate: (connectionId: string, candidate: string) => void;
  onNewOfferCreated: (connectionId: string, answerSDP: string) => void;
  toggleVideo: () => void;
  toggleScreen: (screenId?: string) => void;
}

export const WebRTC = React.forwardRef<IWebRTCRef, IWebRTC>((props, ref) => {
  const { userSession, isSelf } = props;

  const videoRef = React.useRef<any>();

  const audioRef = React.useRef<any>();

  const rtcPeerConnection = React.useRef<RTCPeerConnection>();

  const [fullScreen, setFullScreen] = React.useState<boolean>(false);

  const [videoWidth, setVideoWidth] = React.useState<number>(200);
  const [videoHeight, setVideoHeight] = React.useState<number>(200);

  const maxVideoWidth: number = 800;
  const maxVideoHeight: number = 800;

  const {
    serverConnection,
    audio,
    video,
    setVideo,
    screen,
    setScreen,
    setScreenSelecting,
  } = React.useContext(MeetingContext);

  // 创建接受端
  const createPeerRecvonly = async () => {
    const peer = new RTCPeerConnection();

    peer.addEventListener('addstream', (e: any) => {
      videoRef.current.srcObject = e.stream;
      audioRef.current.srcObject = e.stream;
    });

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.id,
        candidate
      );
    });

    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      userSession.id,
      offer.sdp,
      false,
      false,
      false
    );
  };

  // 创建发送端
  const createPeerSendonly = async () => {
    const peer = new RTCPeerConnection();

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke(
        'ProcessCandidateAsync',
        userSession.id,
        candidate
      );
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });

    stream.getTracks().forEach((track: MediaStreamTrack) => {
      // TODO: should change enabled status by useEffect
      if (track.kind === 'audio') track.enabled = audio;
      peer.addTrack(track, stream);
    });

    videoRef.current.srcObject = stream;

    const offer = await peer.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    await peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      userSession.id,
      offer.sdp,
      true,
      false,
      false
    );
  };

  // 重新创建发送端
  const recreatePeerSendonly = async (
    stream: MediaStream,
    screenStream: MediaStream | undefined = undefined,
    isSharingCamera: boolean,
    isSharingScreen: boolean
  ) => {
    if (videoRef.current?.srcObject) {
      videoRef.current?.srcObject
        .getTracks()
        .forEach((track: MediaStreamTrack) => {
          track.stop();
        });
    }

    const peer = new RTCPeerConnection();

    stream.getTracks().forEach((track: MediaStreamTrack) => {
      peer.addTrack(track, stream);
    });

    if (screenStream) {
      screenStream.getTracks().forEach((track: MediaStreamTrack) => {
        stream.addTrack(track);
        peer.addTrack(track, screenStream);
      });
    }

    videoRef.current.srcObject = stream;

    const offer = await peer.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    await peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    console.log('------', isSharingCamera, isSharingScreen);
    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      userSession.id,
      offer?.sdp,
      true,
      isSharingCamera,
      isSharingScreen
    );
  };

  // 恢复发送端
  const resumePeerSendonly = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });

    await recreatePeerSendonly(stream, undefined, false, false);
  };

  // 摄像头
  const toggleVideo = useLockFn(async () => {
    if (video) {
      await resumePeerSendonly();
      setVideo(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (stream) {
        await recreatePeerSendonly(stream, undefined, true, false);
        setVideo(true);
        setScreen(false);
      }
    }
  });

  // 共享屏幕
  const toggleScreen = useLockFn(async (screenId?: string) => {
    setScreenSelecting(true);
    if (screen) {
      await resumePeerSendonly();
      setScreen(false);
      setScreenSelecting(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      const videoConstraints: any = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenId,
          minWidth: 1080,
          maxWidth: 1080,
          minHeight: 520,
          maxHeight: 520,
        },
      };
      const screenStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      if (stream && screenStream) {
        await recreatePeerSendonly(stream, screenStream, false, true);
        setScreen(true);
        setVideo(false);
        setScreenSelecting(false);
      }
    }
  });

  const onProcessAnswer = (
    _connectionId: string,
    answerSDP: string,
    isSharingCamera: boolean,
    isSharingScreen: boolean
  ) => {
    console.log('------333');
    rtcPeerConnection?.current?.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
    );
    if (isSharingScreen || isSharingCamera) {
      setVideoWidth(800);
      setVideoHeight(800);
    } else {
      setVideoWidth(200);
      setVideoHeight(200);
    }
  };

  const onAddCandidate = (_connectionId: string, candidate: string) => {
    const objCandidate = JSON.parse(candidate);
    rtcPeerConnection?.current?.addIceCandidate(objCandidate);
  };

  const onNewOfferCreated = () => {
    if (!isSelf) {
      createPeerRecvonly();
    }
  };

  React.useImperativeHandle(ref, () => ({
    onProcessAnswer,
    onAddCandidate,
    onNewOfferCreated,
    toggleVideo,
    toggleScreen,
  }));

  React.useLayoutEffect(() => {
    if (isSelf) {
      createPeerSendonly();
    } else {
      createPeerRecvonly();
    }
  }, [serverConnection?.current]);

  React.useEffect(() => {
    console.log('---0000---');
    if (isSelf && videoRef.current?.srcObject) {
      videoRef.current.srcObject
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = audio;
        });
    } else if (!isSelf && videoRef.current?.srcObject) {
      console.log('------111');
    }
  }, [audio, isSelf, videoRef.current?.srcObject]);

  const showVideo = userSession.isSharingCamera || userSession.isSharingScreen;
  return (
    <>
      <Box component="div" style={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          width={showVideo ? maxVideoWidth : 0}
          height={showVideo ? maxVideoHeight : 0}
          style={styles.video}
          muted={isSelf}
        />

        {!showVideo && (
          <Avatar src={userSession.avatar} style={styles.avatar} />
        )}

        {!isSelf && <audio ref={audioRef} autoPlay muted={isSelf} />}
        {!showVideo && (
          <Box component="div" style={styles.userName}>
            {userSession.userName}
          </Box>
        )}
      </Box>
    </>
  );
});
