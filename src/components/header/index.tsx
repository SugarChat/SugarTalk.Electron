import React, { FunctionComponent } from 'react';
import styles from './index.scss';

export interface HeaderProps {
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
}

export const Header: FunctionComponent<HeaderProps> = ({
  leftComponent,
  rightComponent,
}) => {
  const renderElement = (Element: React.ReactNode): JSX.Element =>
    typeof Element === 'function' ? Element() : Element;

  return (
    <div className={styles.rootHeader}>
      <div>{renderElement(leftComponent)}</div>
      <div className={styles.title}>腾讯会议</div>
      <div>{renderElement(rightComponent)}</div>
    </div>
  );
};
