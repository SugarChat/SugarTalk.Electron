import { Login } from './login/index';
import { JoinMeeting } from './join-meeting';
import { ScheduleMeeting } from './schedule-meeting';
import { MeetingList } from './meeting-list';
import { Meeting } from './meeting';
import { ScreenShareSelector } from './meeting/components/screen-share-selector';

export default [
  { component: Login, path: '/', name: 'Login', auth: false, exact: true },
  {
    component: JoinMeeting,
    path: '/JoinMeeting',
    name: 'JoinMeeting',
    auth: true,
    exact: true,
  },
  {
    component: ScheduleMeeting,
    path: '/ScheduleMeeting',
    name: 'ScheduleMeeting',
    auth: true,
    exact: true,
  },
  {
    component: MeetingList,
    path: '/MeetingList',
    name: 'MeetingList',
    auth: true,
    exact: true,
  },
  {
    component: Meeting,
    path: '/Meeting',
    name: 'Meeting',
    auth: true,
    exact: true,
  },
  {
    component: ScreenShareSelector,
    path: '/ScreenSelector',
    name: 'Select screen',
    auth: true,
    exact: true,
  },
] as IRoute[];

export interface IRoute {
  path: string;
  name: string;
  component: React.FunctionComponent;
  auth: boolean;
  exact: boolean;
}
