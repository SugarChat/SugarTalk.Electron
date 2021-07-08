import React from 'react';
import { HashRouter as Router, Switch } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import './App.global.scss';
import routes from './screens';
import { AuthRoute } from './services/routes/auth-router';
import { RootStoreProvider } from './contexts/root-store-provider';
import { setupRootStore } from './contexts/setup-store';

export default function App() {
  const rootStoreFromLocalStorage = setupRootStore();
  return (
    <RootStoreProvider rootStoreFromLocalStorage={rootStoreFromLocalStorage}>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <Switch>
            <AuthRoute routers={routes} />
          </Switch>
        </Router>
      </SnackbarProvider>
    </RootStoreProvider>
  );
}
