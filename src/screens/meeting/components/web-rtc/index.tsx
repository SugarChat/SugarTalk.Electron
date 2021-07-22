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
    currentConnectionId,
    setCurrentConnectionId,
  } = React.useContext(MeetingContext);

  const createPeerSendonly = async () => {
    console.log('----createPeerSendonly------');

    const peer = new RTCPeerConnection();

    peer.addEventListener('icecandidate', (candidate) => {
      serverConnection?.invoke('ProcessCandidateAsync', id, candidate);
    });

    const audioStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true && hasAudio,
    });

    audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = microphoneEnabled;
      peer.addTrack(track, audioStream);
    });

    const offer = await peer.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    serverConnection?.invoke('ProcessOfferAsync', id, offer.sdp);
  };

  const createPeerRecvonly = async () => {
    console.log('creating recv connection');
    const peer = new RTCPeerConnection();

    peer.addEventListener('addstream', (e: any) => {
      console.log('adding stream recv for' + id);
      console.log(e.stream.getTracks());
      videoRef.current.srcObject = e.stream;
      audioRef.current.srcObject = e.stream;
    });

    peer.addEventListener('icecandidate', (candidate) => {
      console.log('recv ice for' + id);
      serverConnection?.invoke('ProcessCandidateAsync', id, candidate);
    });

    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    peer.setLocalDescription(offer);

    rtcPeerConnection.current = peer;

    serverConnection?.invoke('ProcessOfferAsync', id, offer.sdp);
  };

  React.useEffect(() => {
    if (isSelf) {
      createPeerSendonly();
    } else {
      createPeerRecvonly();
    }

    serverConnection?.on('ProcessAnswer', (connectionId, answerSDP) => {
      console.log('processing answer for id ' + connectionId);
      console.log(id);
      if (id === connectionId) {
        console.log('-----id matched---');

        rtcPeerConnection?.current?.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
        );
      }
    });

    serverConnection?.on('AddCandidate', (connectionId, candidate) => {
      if (id === connectionId) {
        const objCandidate = JSON.parse(candidate);
        rtcPeerConnection?.current?.addIceCandidate(objCandidate);
      }
    });
  }, [serverConnection]);

  useEffect(() => {
    if (isSelf && audioRef.current?.srcObject) {
      console.log(microphoneEnabled);
      audioRef.current.srcObject
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => {
          track.enabled = microphoneEnabled;
        });
    }
  }, [microphoneEnabled]);

  useEffect(() => {
    console.log('---camera enabled----', cameraEnabled);
    if (isSelf && videoRef.current?.srcObject) {
      console.log('--setting camera---');
      const videoTracks = videoRef.current.srcObject.getVideoTracks();

      videoTracks.forEach((track: MediaStreamTrack) => {
        console.log(track);

        track.enabled = cameraEnabled;
      });
    }

    if (props.cameraEnabled) {
      // sendOnlyLocalStream
      //   .getVideoTracks()
      //   .forEach((track: MediaStreamTrack) => {
      //     rtcSendPeerRef?.current?.addTrack(
      //       track,
      //       sendOnlyLocalStream.current as MediaStream
      //     );
      //     track.enabled = true;
      //   });
      // console.log('----camera capturing------');
    }

    //videoRef.current.srcObject = sendOnlyLocalStream.current;
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
      const screenStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints,
      });

      const videoTracks = screenStream.getVideoTracks();

      rtcPeerConnection?.current?.addTrack(videoTracks[0], screenStream);

      videoRef.current.srcObject = screenStream;

      const offer = await rtcPeerConnection?.current?.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      rtcPeerConnection?.current?.setLocalDescription(offer);

      serverConnection?.invoke('ProcessOfferAsync', id, offer?.sdp);
    }
  };
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
