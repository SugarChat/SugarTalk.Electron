import React, { FunctionComponent, CSSProperties } from 'react';

import * as styles from './styles';

export interface ScreenProps {
  style?: CSSProperties;
}

export const PageScreen: FunctionComponent<ScreenProps> = ({
  children,
  style: styleOverride,
}) => {
  const viewStyle = { ...styles.root, ...styleOverride };

  return <div style={viewStyle}>{children}</div>;
};
