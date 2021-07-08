import React from 'react';
import { useHistory } from 'react-router-dom';
import { UserInfo } from './user-info';
import * as styles from './styles';
import { JoinMeeting } from './join-meeting';
import { BeginMeeting } from './begin-meeting';
import { ScheduleMeeting } from './schedule-meeting';
import { Setting } from './setting';

export const MeetingList = () => {
  const history = useHistory();

  return (
    <div style={styles.root}>
      <div>
        <div style={styles.userInfoDiv}>
          <UserInfo />
        </div>
        <div style={styles.settingDiv}>
          <Setting />
        </div>
        <div style={styles.clear} />
      </div>

      <div>
        <table style={styles.table}>
          <td style={styles.tableTd}>
            <JoinMeeting />
          </td>
          <td style={styles.tableTd}>
            <BeginMeeting />
          </td>
          <td style={styles.tableTd}>
            <ScheduleMeeting />
          </td>
        </table>
      </div>

      <div style={styles.line} />
      <div style={styles.background} />
    </div>
  );
};
