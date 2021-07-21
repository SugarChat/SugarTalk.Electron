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

  const createPeerSendonly = async () => {
    console.log('----createPeerSendonly------');

    if (!rtcSendPeerRef.current) {
      console.log('----creating new RTCPeerConnection------');
      rtcSendPeerRef.current = new RTCPeerConnection(configuration);

      rtcSendPeerRef.current.addEventListener('icecandidate', (candidate) => {
        serverConnection?.invoke('ProcessCandidateAsync', id, candidate);
      });
    }

    const audioStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true && hasAudio,
    });

    audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = microphoneEnabled;
      rtcSendPeerRef?.current?.addTrack(track, audioStream);
    });

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
        console.log('adding stream recv for' + id);
        console.log(e.stream.getTracks());
        videoRef.current.srcObject = e.stream;
        audioRef.current.srcObject = e.stream;
      });

      rtcRecvPeerRef.current.addEventListener('icecandidate', (candidate) => {
        console.log('recv ice for' + id);
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
      createPeerRecvonly();
    }

    serverConnection?.on('ProcessAnswer', (connectionId, answerSDP) => {
      console.log('processing answer for id ' + connectionId);
      console.log(id);
      if (id === connectionId) {
        console.log('-----id matched---');

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

      rtcSendPeerRef?.current?.addTrack(videoTracks[0], screenStream);

      videoRef.current.srcObject = screenStream;

      const offer = await rtcSendPeerRef?.current?.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      rtcSendPeerRef?.current?.setLocalDescription(offer);

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
