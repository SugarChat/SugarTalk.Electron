import electron from 'electron';

export const createMeetingWindow = (
  currentWindow: electron.BrowserWindow,
  meetingInfoQuery: string
) => {
  const meetingWindow = new electron.remote.BrowserWindow({
    show: true,
    width: 960,
    minWidth: 960,
    height: 640,
    minHeight: 640,
    movable: true,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  meetingWindow.loadURL(
    `file://${__dirname}/index.html#/meeting?${meetingInfoQuery}`
  );

  meetingWindow.once('closed', () => {
    currentWindow.show();
  });
};
