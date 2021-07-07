import React, { FunctionComponent } from 'react';
import * as styles from './styles';
import styless from './index.scss';

export interface HeaderProps {
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  title?: string;
}

export const Header: FunctionComponent<HeaderProps> = ({
  leftComponent,
  rightComponent,
  title,
}) => {
  const renderElement = (Element: React.ReactNode): JSX.Element =>
    typeof Element === 'function' ? Element() : Element;

  return (
    <div style={styles.rootHeader} className={styless.rootHeader}>
      <div>{renderElement(leftComponent)}</div>
      <div style={styles.title}>{title}</div>
      <div>{renderElement(rightComponent)}</div>
    </div>
  );
};
