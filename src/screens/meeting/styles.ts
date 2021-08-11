import { CSSProperties } from 'react';

export const root: CSSProperties = {
  padding: 0,
  backgroundColor: '#fafafa',
  height: '100%',
};

export const webRTCContainer: CSSProperties = {
  height: '90%',
  overflow: 'auto',
  padding: '10px',
  textAlign: 'center',
};

export const sharingRootContainer: CSSProperties = {
  height: '90%',
  padding: '5px',
  display: 'flex',
  flexDirection: 'row',
};

export const sharingContainer: CSSProperties = {
  padding: '5px',
  display: 'flex',
  flex: 9,
};

export const verticalUserListContainer: CSSProperties = {
  padding: '5px',
  display: 'flex',
  textAlign: 'center',
  flex: 1,
};
