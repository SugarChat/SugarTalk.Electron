import { CSSProperties } from 'react';

export const screenWidth = window.document;

export const root: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  backgroundColor: '#fafafa',
  height: '100%',
};

export const webRTCContainer = (isSharing: boolean) => {
  if (!isSharing) {
    return {
      width: '100%',
      flex: '1',
      overflow: 'hidden',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      backgroundColor: '#fff',
    } as CSSProperties;
  }
  return {
    flex: '1',
    width: '100%',
    overflow: 'hidden',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
  } as CSSProperties;
};

export const sharingRootContainer: CSSProperties = {
  height: '100%',
  marginBottom: '10px',
  padding: '5px',
  display: 'flex',
  justifyContent: 'space-between',
};

export const sharingContainer: CSSProperties = {
  flex: '1',
};
