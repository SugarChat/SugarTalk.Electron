import React from 'react';
import styles from './index.scss';
import { RouteComponentProps } from 'react-router-dom';
import { Button } from '@material-ui/core';

export const Meeting = ({ history }: RouteComponentProps) => {
  return (
    <div className={styles.root}>
      <Button onClick={() => history.goBack()}>Back</Button>
    </div>
  );
};
