import { CSSProperties } from 'react';

export const content: CSSProperties = {};

export const root: CSSProperties = {
  flex: '1',
  flexDirection: 'column',
  alignItems: 'flex-start',
  height: '100%',
};

export const userInfo: CSSProperties = {
  paddingLeft: '30px',
};

export const clear: CSSProperties = {
  clear: 'both',
};

export const table: CSSProperties = {
  width: '100%',
  paddingTop: '20px',
};

export const tableTd: CSSProperties = {
  textAlign: 'center',
};

export const line: CSSProperties = {
  borderBottom: 'solid #DCDCDC 1px',
  width: '100%',
  height: '0px',
  paddingTop: '15px',
};

export const background: CSSProperties = {
  width: '100%',
  height: '100%',
  background:
    'url(../src/screens/meeting-list/images/background.png) no-repeat center top 25%',
};

export const settingDiv: CSSProperties = {
  float: 'right',
  paddingTop: '10px',
  paddingRight: '30px',
};

export const userInfoDiv: CSSProperties = {
  float: 'left',
  width: '250px',
};
