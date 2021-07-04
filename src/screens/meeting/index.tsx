import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Box } from '@material-ui/core';
import styles from './index.scss';
import StatusBar from './components/status-bar';
import FooterToolbar from './components/footer-toolbar';

export const Meeting = ({ history }: RouteComponentProps) => {
  return (
    <Box className={styles.root}>
      <StatusBar duration="02:45:20" />
      <FooterToolbar />
    </Box>
  );
};
