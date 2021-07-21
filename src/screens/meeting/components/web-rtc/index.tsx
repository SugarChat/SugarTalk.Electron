import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { MeetingContext } from '../../context';
import * as styles from './styles';

interface IWebRTC {
  id: string;
  userName: string;
  isSelf: boolean;
  sharingScreenId: string;
  cameraEnabled: boolean;
}

export const WebRTC = (props: IWebRTC) => {
  const { id, userName = 'unknown', isSelf } = props;

  const videoRef = React.useRef<any>();

  const audioRef = React.useRef<any>();

  const rtcSendPeerRef = React.useRef<RTCPeerConnection>();

  const rtcRecvPeerRef = React.useRef<RTCPeerConnection>();

  const [initialized, setInitialized] = React.useState<boolean>(false);

  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: ['stun:54.241.145.83'],
      },
      {
        urls: ['turn:54.241.145.83'],
        username: 'kurento',
        credential: 'YamimealTurn',
        credentialType: 'password',
      },
    ],
  };

  const {
    cameraEnabled,
    microphoneEnabled,
    serverConnection,
    hasVideo,
    hasAudio,
    screenSharingId,
    currentConnectionId,
    setCurrentConnectionId,
  } = React.useContext(MeetingContext);

  let sendOnlyLocalStream = React.useRef<MediaStream>();

  const createPeerSendonly = async () => {
    console.log('----createPeerSendonly------');

    if (!rtcSendPeerRef.current) {
      console.log('----creating new RTCPeerConnection------');
      rtcSendPeerRef.current = new RTCPeerConnection(configuration);

      rtcSendPeerRef.current.addEventListener('icecandidate', (candidate) => {
        console.log('send ice');
        serverConnection?.invoke('ProcessCandidateAsync', id, candidate);
      });
    }

    console.log(hasAudio, hasVideo, microphoneEnabled, cameraEnabled);

    sendOnlyLocalStream.current = await navigator.mediaDevices.getUserMedia({
      video: false && hasVideo,
      audio: true && hasAudio,
    });

    sendOnlyLocalStream.current
      .getAudioTracks()
      .forEach((track: MediaStreamTrack) => {
        track.enabled = microphoneEnabled;
        rtcSendPeerRef?.current?.addTrack(
          track,
          sendOnlyLocalStream.current as MediaStream
        );
      });

    if (props.sharingScreenId) {
      const videoConstraints: any = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: props.sharingScreenId,
          minWidth: 1080,
          maxWidth: 1080,
          minHeight: 520,
          maxHeight: 520,
        },
      };
      const screenStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints,
      });

      const videoTracks = screenStream.getVideoTracks();
      sendOnlyLocalStream.current.addTrack(videoTracks[0]);

      rtcSendPeerRef?.current.addTrack(
        videoTracks[0],
        sendOnlyLocalStream.current
      );
      console.log('----sharing screen------');
    } else if (props.cameraEnabled) {
      sendOnlyLocalStream.current
        .getVideoTracks()
        .forEach((track: MediaStreamTrack) => {
          rtcSendPeerRef?.current?.addTrack(
            track,
            sendOnlyLocalStream.current as MediaStream
          );
          track.enabled = true;
        });
      console.log('----camera capturing------');
    }

    videoRef.current.srcObject = sendOnlyLocalStream.current;

    const offer = await rtcSendPeerRef?.current.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    rtcSendPeerRef?.current.setLocalDescription(offer);

    serverConnection?.invoke('ProcessOfferAsync', id, offer.sdp);
  };

  const createPeerRecvonly = async () => {
    if (!rtcRecvPeerRef.current) {
      console.log('creating recv connection');
      rtcRecvPeerRef.current = new RTCPeerConnection(configuration);

      rtcRecvPeerRef.current.addEventListener('addstream', (e: any) => {
        console.log('adding stream recv');
        console.log(e.stream);
        videoRef.current.srcObject = e.stream;
        audioRef.current.srcObject = e.stream;
      });

      rtcRecvPeerRef.current.addEventListener('icecandidate', (candidate) => {
        console.log('recv ice');
        serverConnection?.invoke('ProcessCandidateAsync', id, candidate);
      });

      const offer = await rtcRecvPeerRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      rtcRecvPeerRef.current.setLocalDescription(offer);

      serverConnection?.invoke('ProcessOfferAsync', id, offer.sdp);
    }
  };

  React.useEffect(() => {
    if (isSelf) {
      createPeerSendonly();
    } else {
      console.log('---1---');
      createPeerRecvonly();
    }

    if (!initialized) {
      serverConnection?.on('ProcessAnswer', (connectionId, answerSDP) => {
        if (id === connectionId) {
          rtcRecvPeerRef.current?.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
          );
        }
      });

      serverConnection?.on('AddCandidate', (connectionId, candidate) => {
        if (id === connectionId) {
          const objCandidate = JSON.parse(candidate);
          rtcRecvPeerRef.current?.addIceCandidate(objCandidate);
        }
      });
      setInitialized(true);
    }
  });

  useEffect(() => {
    if (isSelf && audioRef.current?.srcObject) {
      console.log(microphoneEnabled);
      audioRef.current.srcObject
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = microphoneEnabled;
        });
    }
  });

  useEffect(() => {
    console.log('---camera enabled----');
    if (isSelf && videoRef.current?.srcObject) {
      videoRef.current.srcObject
        .getVideoTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = cameraEnabled;
        });
    }
  }, [cameraEnabled]);

  return (
    <Box component="div" style={styles.videoContainer}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="200"
        height="200"
        style={styles.video}
        muted={isSelf}
      />
      {!isSelf && <audio ref={audioRef} autoPlay playsInline muted={isSelf} />}
      <Box component="div" style={styles.userName}>
        {userName}
      </Box>
    </Box>
  );
};
