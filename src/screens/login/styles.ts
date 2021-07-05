import { CSSProperties } from 'react';

export const root: CSSProperties = {
  flex: '1',
  flexDirection: 'column',
  alignItems: 'flex-start',
  height: '100%',
  padding: '0px 24px',
};

export const content: CSSProperties = {};

export const settings: CSSProperties = {
  color: '#333',
  width: '25px',
  height: '25px',
};

export const settingWrapper: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

export const joinMeeting: CSSProperties = { width: '100%', height: '40px' };

export const login: CSSProperties = {
  color: '#2196F3',
  marginTop: '20px',
  width: '100%',
  height: '40px',
};

export const otherLogin: CSSProperties = {
  position: 'relative',
  display: 'flex',
  marginTop: '30px',
  justifyContent: 'center',
  alignItems: 'center',
};

export const otherLoginText: CSSProperties = {
  position: 'absolute',
  backgroundColor: '#fff',
  padding: '0 20px',
  color: '#999',
  fontSize: '12px',
};

export const line: CSSProperties = {
  width: '100%',
  borderTop: '1px solid #999',
};

export const otherLoginButtonsWrapper: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginTop: '30px',
};

export const buttonWrapper: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '60px',
  cursor: 'pointer',
};

export const buttonText: CSSProperties = {
  textAlign: 'center',
  color: '#999',
  fontSize: '12px',
  padding: '5px 0',
};

export const images: CSSProperties = { width: '40px', height: '40px' };
