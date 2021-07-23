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

    recreatePeerConnection('', cameraEnabled).then((peer) => {
      peer.current?.addEventListener('icecandidate', (candidate) => {
        serverConnection?.current?.invoke(
          'ProcessCandidateAsync',
          id,
          candidate
        );
      });
    });
  };

  const createPeerRecvonly = async () => {
    console.log('creating recv connection');
    const peer = new RTCPeerConnection();

    peer.addEventListener('addstream', (e: any) => {
      console.log('---adding stream----');
      videoRef.current.srcObject = e.stream;
      audioRef.current.srcObject = e.stream;
    });

    peer.addEventListener('icecandidate', (candidate) => {
      console.log('---adding ice----');
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
          console.log('-----answer----');
          rtcPeerConnection?.current?.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answerSDP })
          );
        } else {
          console.log('-----answer not the same id----');
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
    if (isSelf) {
      rtcPeerConnection.current?.getSenders().forEach((x) => {
        if (x.track?.kind === 'audio') {
          x.track.enabled = microphoneEnabled;
        }
      });
    }
  }, [microphoneEnabled]);

  useEffect(() => {
    if (isSelf && videoRef.current?.srcObject) {
      recreatePeerConnection('', cameraEnabled);
    }
  }, [cameraEnabled]);

  useEffect(() => {
    setupScreenSharing();
  }, [screenSharingId]);

  const setupScreenSharing = async () => {
    if (screenSharingId && isSelf) {
      await recreatePeerConnection(screenSharingId, false);
    }
  };

  const recreatePeerConnection = async (
    screenId: string,
    turnOnCamera: boolean
  ) => {
    if (screenId && turnOnCamera) {
      throw 'Cannot turn on camera while in screen sharing';
    }

    if (videoRef.current?.srcObject) {
      videoRef.current?.srcObject
        .getTracks()
        .forEach((track: MediaStreamTrack) => {
          track.stop();
        });
    }

    const peer = new RTCPeerConnection();

    const baseStream = await navigator.mediaDevices.getUserMedia({
      audio: true && hasAudio,
      video: turnOnCamera && hasVideo,
    });

    baseStream.getTracks().forEach((track: MediaStreamTrack) => {
      if (track.kind === 'audio') {
        track.enabled = microphoneEnabled;
      } else if (track.kind === 'video') {
        track.enabled = cameraEnabled;
      }

      peer.addTrack(track, baseStream);
    });

    if (screenId) {
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
        audio: false,
        video: videoConstraints,
      });

      screenStream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.kind === 'audio') {
          track.enabled = microphoneEnabled;
        } else if (track.kind === 'video') {
          track.enabled = true;
        }
        baseStream.addTrack(track);
        peer.addTrack(track, screenStream);
      });
    }

    videoRef.current.srcObject = baseStream;

    rtcPeerConnection.current = peer;

    const offer = await rtcPeerConnection?.current?.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    rtcPeerConnection?.current?.setLocalDescription(offer);

    serverConnection?.current?.invoke('ProcessOfferAsync', id, offer?.sdp);

    return rtcPeerConnection;
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
