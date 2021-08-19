import { CSSProperties } from 'react';

export const listRoot: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: 0,
  height: '100%',
};

export const listItem: CSSProperties = {
  justifyContent: 'center',
};

export const userContainer: CSSProperties = {
  margin: '5px',
  display: 'inline-block',
};

export const userNameContainer: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1px 0px',
  userSelect: 'none',
  fontSize: '14px',
  textAlign: 'center',
  height: '25px',
};

export const avatar: CSSProperties = {
  marginBottom: '2px',
  width: '70px',
  height: '70px',
};
