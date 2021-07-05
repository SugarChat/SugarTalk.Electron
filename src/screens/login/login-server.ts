import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import url from 'url';
import * as electron from 'electron';
// const http = require('http');
// const url = require('url');
// const destroyer = require('server-destroy');

export const getAuthenticatedClient = (): Promise<OAuth2Client> => {
  return new Promise((resolve, reject) => {
    const oAuth2Client = new OAuth2Client(
      '542556032036-kch832eb37jpm8s9aafjf043jl25gjj7.apps.googleusercontent.com',
      'cdeRffCHhMvTMek20Eb8KYbY',
      'http://localhost:3000'
    );

    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
    });

    const server = http
      .createServer(async (req, _) => {
        try {
          if ((req.url as string).indexOf('code') > -1) {
            const qs = new url.URL(req.url as string, 'http://localhost:3000')
              .searchParams;
            const code = qs.get('code') as string;
            // console.log(`Code is ${code}`);
            server.close();
            const r = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(r.tokens);
            resolve(oAuth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        const authWindow = new electron.remote.BrowserWindow({
          show: true,
          width: 375,
          height: 668,
          movable: true,
          modal: true,
          webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
          },
        });

        authWindow.webContents.userAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0';
        authWindow.loadURL(authorizeUrl);

        authWindow.webContents.on(
          'did-redirect-navigation',
          (event, newUrl) => {
            authWindow.close();
          }
        );
        // open the browser to the authorize url to start the workflow
        // open(authorizeUrl, { wait: false })
        //   .then((cp) => cp.unref())
        //   .catch(() => {});
      });
  });
};
