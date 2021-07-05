import React, { FunctionComponent } from 'react';
import styles from './index.scss';

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
    <div className={styles.rootHeader}>
      <div>{renderElement(leftComponent)}</div>
      <div className={styles.title}>{title}</div>
      <div>{renderElement(rightComponent)}</div>
    </div>
  );
};
