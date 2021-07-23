import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { MeetingContext } from '../../context';
import * as styles from './styles';

interface IWebRTC {
  id: string;
  userName: string;
  isSelf: boolean;
  cameraEnabled: boolean;
}

export const WebRTC = (props: IWebRTC) => {
  const { id, userName = 'unknown', isSelf } = props;

  const videoRef = React.useRef<any>();

  const audioRef = React.useRef<any>();

  const rtcPeerConnection = React.useRef<RTCPeerConnection>();

  const {
    cameraEnabled,
    microphoneEnabled,
    serverConnection,
    hasVideo,
    hasAudio,
    screenSharingId,
  } = React.useContext(MeetingContext);

  const createPeerSendonly = async () => {
    console.log('----createPeerSendonly------', serverConnection);

    const peer = new RTCPeerConnection();

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.current?.invoke('ProcessCandidateAsync', id, candidate);
    });

    const audioStream = await navigator.mediaDevices.getUserMedia({
      video: false && hasVideo,
      audio: true && hasAudio,
    });

    audioStream.getTracks().forEach((track: MediaStreamTrack) => {
      if (track.kind === 'audio') {
        track.enabled = microphoneEnabled;
      } else if (track.kind === 'video') {
        track.enabled = cameraEnabled;
      }

      peer.addTrack(track, audioStream);
    });

    videoRef.current.srcObject = audioStream;

    const offer = await peer.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    serverConnection?.current?.invoke('ProcessOfferAsync', id, offer.sdp);
  };

  const createPeerRecvonly = async () => {
    console.log('creating recv connection');
    const peer = new RTCPeerConnection();

    peer.addEventListener('addstream', (e: any) => {
      console.log(e.stream);
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

    peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    serverConnection?.current?.invoke('ProcessOfferAsync', id, offer.sdp);
  };

  React.useEffect(() => {
    console.log('----starting----');
    if (isSelf) {
      createPeerSendonly();
    } else {
      createPeerRecvonly();
    }

    serverConnection?.current?.on(
      'ProcessAnswer',
      (connectionId, answerSDP) => {
        if (id === connectionId) {
          rtcPeerConnection?.current?.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
          );
        }
      }
    );

    serverConnection?.current?.on('AddCandidate', (connectionId, candidate) => {
      if (id === connectionId) {
        const objCandidate = JSON.parse(candidate);
        rtcPeerConnection?.current?.addIceCandidate(objCandidate);
      }
    });
  }, [serverConnection?.current]);

  useEffect(() => {
    console.log(microphoneEnabled, isSelf, audioRef.current?.srcObject);
    if (isSelf && videoRef.current?.srcObject) {
      videoRef.current.srcObject
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = microphoneEnabled;
        });
    }
  }, [microphoneEnabled]);

  useEffect(() => {
    console.log(isSelf, videoRef.current?.srcObject);
    if (isSelf && videoRef.current?.srcObject) {
      console.log('----video2---');
      const videoTracks = videoRef.current.srcObject.getVideoTracks();

      videoTracks.forEach((track: MediaStreamTrack) => {
        track.enabled = cameraEnabled;
      });
    }
  }, [cameraEnabled]);

  useEffect(() => {
    setupScreenSharing();
  }, [screenSharingId]);

  const setupScreenSharing = async () => {
    if (screenSharingId && isSelf) {
      const videoConstraints: any = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenSharingId,
          minWidth: 1080,
          maxWidth: 1080,
          minHeight: 520,
          maxHeight: 520,
        },
      };

      const peer = new RTCPeerConnection();

      const screenStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints,
      });
      console.log('-----111----');

      screenStream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.kind === 'audio') {
          track.enabled = microphoneEnabled;
        } else if (track.kind === 'video') {
          track.enabled = true;
        }

        peer.addTrack(track, screenStream);
      });

      console.log('-----aaa----');

      rtcPeerConnection.current = peer;

      videoRef.current.srcObject = screenStream;

      const offer = await rtcPeerConnection?.current?.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      rtcPeerConnection?.current?.setLocalDescription(offer);

      serverConnection?.current?.invoke('ProcessOfferAsync', id, offer?.sdp);
    }
  };
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
};
