import { Box } from '@material-ui/core';
import { useLockFn } from 'ahooks';
import React from 'react';
import { MeetingContext } from '../../context';
import * as styles from './styles';

interface IWebRTC {
  id: string;
  userName: string;
  isSelf: boolean;
}

export interface IWebRTCRef {
  onProcessAnswer: (connectionId: string, answerSDP: string) => void;
  onAddCandidate: (connectionId: string, candidate: string) => void;
  onNewOfferCreated: (connectionId: string, answerSDP: string) => void;
  toggleVideo: () => void;
  toggleScreen: (screenId?: string) => void;
}

export const WebRTC = React.forwardRef<IWebRTCRef, IWebRTC>((props, ref) => {
  const { id, userName = 'unknown', isSelf } = props;

  const videoRef = React.useRef<any>();

  const audioRef = React.useRef<any>();

  const rtcPeerConnection = React.useRef<RTCPeerConnection>();

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
      serverConnection?.current?.invoke('ProcessCandidateAsync', id, candidate);
    });

    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      id,
      offer.sdp,
      false
    );
  };

  // 创建发送端
  const createPeerSendonly = async () => {
    const peer = new RTCPeerConnection();

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke('ProcessCandidateAsync', id, candidate);
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });

    videoRef.current.srcObject = stream;

    stream.getTracks().forEach((track: MediaStreamTrack) => {
      if (track.kind === 'audio') {
        track.enabled = audio;
      }
      peer.addTrack(track, stream);
    });

    const offer = await peer.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    await peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      id,
      offer.sdp,
      true
    );
  };

  // 重新创建发送端
  const recreatePeerSendonly = async (
    stream: MediaStream,
    screenStream: MediaStream | undefined = undefined
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
      if (track.kind === 'audio') {
        track.enabled = audio;
      }
      peer.addTrack(track, stream);
    });

    if (screenStream) {
      screenStream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.kind === 'audio') {
          track.enabled = audio;
        }
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

    await serverConnection?.current?.invoke(
      'ProcessOfferAsync',
      id,
      offer?.sdp,
      true
    );
  };

  // 恢复发送端
  const resumePeerSendonly = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });

    await recreatePeerSendonly(stream);
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
        await recreatePeerSendonly(stream);
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
        await recreatePeerSendonly(stream, screenStream);
        setScreen(true);
        setVideo(false);
        setScreenSelecting(false);
      }
    }
  });

  const onProcessAnswer = (_connectionId: string, answerSDP: string) => {
    rtcPeerConnection?.current?.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
    );
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
    if (isSelf && videoRef.current?.srcObject) {
      videoRef.current.srcObject
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = audio;
        });
    }
  }, [audio, isSelf]);

  return (
    <Box component="div" style={styles.videoContainer}>
      <video
        ref={videoRef}
        autoPlay
        width="200"
        height="200"
        style={styles.video}
        muted={isSelf}
      />
      {!isSelf && <audio ref={audioRef} autoPlay muted={isSelf} />}
      <Box component="div" style={styles.userName}>
        {userName}
      </Box>
    </Box>
  );
});
