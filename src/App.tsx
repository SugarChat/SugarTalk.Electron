import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.scss';
import routes from './screens';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={routes.Login} />
      </Switch>
    </Router>
  );
}
