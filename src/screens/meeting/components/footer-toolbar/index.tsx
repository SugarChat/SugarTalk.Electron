import React from 'react';
import { Box, Grid, Button } from '@material-ui/core';
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import SmsIcon from '@material-ui/icons/Sms';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import SecurityIcon from '@material-ui/icons/Security';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ForumIcon from '@material-ui/icons/Forum';
import LiveTvIcon from '@material-ui/icons/LiveTv';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import styles from './index.scss';

interface IToolButton {
  text: string;
  icon: React.ReactElement;
}

const ToolButton = (props: IToolButton) => {
  const { text, icon } = props;

  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      className={styles.toolButton}
    >
      <Grid item className={styles.toolButtonIconWrapper}>
        {icon}
      </Grid>
      <Grid item className={styles.toolButtonTextWrapper}>
        <Box component="span" className={styles.toolButtonText}>
          {text}
        </Box>
      </Grid>
    </Grid>
  );
};

const FooterToolbar = () => {
  return (
    <Box className={styles.root}>
      <Grid
        container
        direction="row"
        alignItems="center"
        justify="center"
        className={styles.footerToolbarContainer}
      >
        <ToolButton text="关闭静音" icon={<MicIcon />} />
        <ToolButton text="关闭视频" icon={<VideocamIcon />} />
        <ToolButton text="共享屏幕" icon={<ScreenShareIcon />} />
        <ToolButton text="安全" icon={<SecurityIcon />} />
        <ToolButton text="邀请" icon={<GroupAddIcon />} />
        <ToolButton text="管理成员" icon={<PeopleAltIcon />} />
        <ToolButton text="聊天" icon={<SmsIcon />} />
        <ToolButton text="录制" icon={<FiberManualRecordIcon />} />
        <ToolButton text="分组讨论" icon={<ForumIcon />} />
        <ToolButton text="直播" icon={<LiveTvIcon />} />
        <ToolButton text="更多" icon={<MoreHorizIcon />} />
        <Button variant="outlined" className={styles.exitButton}>
          结束会议
        </Button>
      </Grid>
    </Box>
  );
};

export default React.memo(FooterToolbar);
