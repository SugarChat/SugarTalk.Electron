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
    if (!rtcSendPeerRef.current) {
      console.log('----creating new RTCPeerConnection------');
      rtcSendPeerRef.current = new RTCPeerConnection();

      rtcSendPeerRef.current.addEventListener('icecandidate', (candidate) => {
        serverConnection?.invoke(
          'ProcessCandidateAsync',
          serverConnection?.connectionId,
          candidate
        );
      });
    }

    sendOnlyLocalStream.current = await navigator.mediaDevices.getUserMedia({
      video: false && hasVideo,
      audio: true && hasAudio,
    });

    sendOnlyLocalStream.current
      .getAudioTracks()
      .forEach((track: MediaStreamTrack) => {
        rtcSendPeerRef?.current?.addTrack(
          track,
          sendOnlyLocalStream.current as MediaStream
        );
        track.enabled = microphoneEnabled;
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

    serverConnection?.invoke(
      'ProcessOfferAsync',
      serverConnection?.connectionId,
      offer.sdp
    );
  };

  const createPeerRecvonly = async () => {
    const rtcPeer = new RTCPeerConnection();

    rtcPeer.addEventListener('addstream', (e: any) => {
      videoRef.current.srcObject = e.stream;
      audioRef.current.srcObject = e.stream;
    });

    rtcPeer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.invoke('ProcessCandidateAsync', id, candidate);
    });

    const offer = await rtcPeer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    rtcPeer.setLocalDescription(offer);

    rtcRecvPeerRef.current = rtcPeer;

    serverConnection?.invoke('ProcessOfferAsync', id, offer.sdp);
  };

  React.useEffect(() => {
    if (isSelf) {
      createPeerSendonly();
    } else {
      createPeerRecvonly();
    }

    serverConnection?.on('ProcessAnswer', (connectionId, answerSDP) => {
      if (id === connectionId) {
        rtcRecvPeerRef.current?.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
        );
      }
    });

    serverConnection?.on('AddCandidate', (connectionId, candidate) => {
      if (serverConnection?.connectionId === connectionId) {
        const objCandidate = JSON.parse(candidate);
        rtcRecvPeerRef.current?.addIceCandidate(objCandidate);
      }
    });
    if (serverConnection?.connectionId)
      setCurrentConnectionId(serverConnection.connectionId);
  }, [screenSharingId]);

  useEffect(() => {
    if (isSelf && audioRef.current?.srcObject) {
      audioRef.current.srcObject
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = microphoneEnabled;
        });
    }
  }, [microphoneEnabled]);

  // useEffect(() => {
  //   console.log('---camera enabled----');
  //   if (isSelf && videoRef.current?.srcObject) {
  //     videoRef.current.srcObject
  //       .getVideoTracks()
  //       .forEach((track: MediaStreamTrack) => {
  //         track.enabled = cameraEnabled;
  //       });
  //   }
  // }, [cameraEnabled]);

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
      <audio ref={audioRef} autoPlay muted={isSelf} />
      <Box component="div" style={styles.userName}>
        {userName}
      </Box>
    </Box>
  );
};
