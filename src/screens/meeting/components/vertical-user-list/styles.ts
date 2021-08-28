import { CSSProperties } from 'react';

export const root = (isSharing: boolean) => {
  if (!isSharing) {
    return {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingLeft: '300px',
      paddingRight: '300px',
      backgroundColor: '#fff',
      overflow: 'auto',
    } as CSSProperties;
  }
  return {
    width: '220px',
    height: '100%',
    padding: 0,
    margin: '0px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '10px',
    overflow: 'auto',
    background: 'linear-gradient(to bottom right, #525559, #27292b)',
  } as CSSProperties;
};

export const listItem = (isSharing: boolean, isSpeaking: boolean) => {
  if (!isSharing) {
    return {
      width: '150px',
      height: '150px',
      display: 'flex',
      justifyContent: 'center',
      margin: '10px',
      borderRadius: '4px',
      padding: '0px',
      border: isSpeaking ? '2px solid #04ce6f' : '',
    };
  }
  return {
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#2d3033',
    marginBottom: '10px',
    borderRadius: '4px',
    border: isSpeaking ? '2px solid #7afec6' : '2px solid #5e6166',
  };
};

export const userContainer: CSSProperties = {
  margin: '5px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

export const userNameContainer = (isSharing: boolean) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1px 0px',
    userSelect: 'none',
    fontSize: '14px',
    textAlign: 'center',
    height: '25px',
    color: isSharing ? '#fff' : '#000',
  } as CSSProperties;
};

export const avatar: CSSProperties = {
  marginBottom: '2px',
  width: '70px',
  height: '70px',
};

export const speakingWrapper: CSSProperties = {
  position: 'absolute',
  top: '5px',
  width: '300px',
  height: '25px',
  padding: '5px 10px',
  display: 'flex',
  justifyContent: 'flex-start',
  borderRadius: '4px',
  backgroundColor: '#d9eafe',
  zIndex: '100',
};

export const speakingTitle: CSSProperties = {
  width: '75px',
};
export const namesText: CSSProperties = {
  flex: '1',
  textAlign: 'left',
  overflow: 'hidden',
};
