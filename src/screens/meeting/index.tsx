import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Button } from '@material-ui/core';
import { PageScreen } from '../../components/page-screen/index';

export const Meeting = ({ history }: RouteComponentProps) => {
  return (
    <PageScreen>
      <Button onClick={() => history.goBack()}>Back</Button>
    </PageScreen>
  );
};
