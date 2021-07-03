import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.scss';
import routes from './screens';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/join" component={routes.JoinMeeting} />
        <Route exact path="/schedule" component={routes.ScheduleMeeting} />
        <Route exact path="/meeting" component={routes.Meeting} />
        <Route exact path="/meeting-list" component={routes.MeetingList} />
        <Route path="/" component={routes.Login} />
      </Switch>
    </Router>
  );
}
