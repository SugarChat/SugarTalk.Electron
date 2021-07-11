import electron from 'electron';

export const createMeetingWindow = (
  currentWindow: electron.BrowserWindow,
  meetingInfoQuery: string
) => {
  const meetingWindow = new electron.remote.BrowserWindow({
    show: true,
    width: 1280,
    height: 720,
    movable: true,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  meetingWindow.loadURL(
    `file://${__dirname}/index.html#/meeting?${meetingInfoQuery}`
  );

  meetingWindow.once('closed', () => {
    currentWindow.show();
  });
};
