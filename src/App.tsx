import React from 'react';
import { HashRouter as Router, Switch } from 'react-router-dom';
import './App.global.scss';
import routes from './screens';
import { AuthRoute } from './services/routes/auth-router';
import { RootStoreProvider } from './contexts/root-store-provider';

export default function App() {
  return (
    <RootStoreProvider>
      <Router>
        <Switch>
          <AuthRoute routers={routes} />
        </Switch>
      </Router>
    </RootStoreProvider>
  );
}
