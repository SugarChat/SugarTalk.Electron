import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import Url from 'url';
import FB from 'fb';
import * as electron from 'electron';
import Env from '../../config/env';

export const googleAuthenticated = (): Promise<OAuth2Client> => {
  return new Promise((resolve, reject) => {
    const oAuth2Client = new OAuth2Client(
      Env.googleClientId,
      Env.googleClientSecret,
      Env.googleRedirectUri
    );

    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
    });

    const server = http
      .createServer(async (req, _) => {
        try {
          if ((req.url as string).indexOf('code') > -1) {
            const qs = new Url.URL(req.url as string, 'http://localhost:3000')
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
          },
        });

        authWindow.webContents.userAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0';
        authWindow.loadURL(authorizeUrl);

        authWindow.webContents.on(
          'did-redirect-navigation',
          (_event, newUrl) => {
            if (newUrl.includes('http://localhost:3000')) {
              setTimeout(() => {
                authWindow.close();
              }, 300);
            }
          }
        );

        authWindow.on('close', () => {
          server.close();
        });
      });
  });
};

export const facebookAuthenticated = (): Promise<{ accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const options = {
      client_id: '462234011175255',
      scopes: 'email',
      redirect_uri: 'https://www.facebook.com/connect/login_success.html',
    };

    const authWindow = new electron.remote.BrowserWindow({
      show: false,
      width: 375,
      height: 668,
      movable: true,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      },
    });
    const facebookAuthURL = `https://www.facebook.com/v3.2/dialog/oauth?client_id=${options.client_id}&redirect_uri=${options.redirect_uri}&response_type=token,granted_scopes&scope=${options.scopes}&display=popup`;

    authWindow.loadURL(facebookAuthURL);
    authWindow.webContents.on('did-finish-load', () => {
      authWindow.show();
    });

    let accessToken = '';
    let error: RegExpExecArray | null = null;
    let closedByUser = true;

    const handleUrl = (redirectUrl: string) => {
      const rawCode = /access_token=([^&]*)/.exec(redirectUrl) || '';
      accessToken = rawCode && rawCode.length > 1 ? rawCode[1] : '';
      error = /\?error=(.+)$/.exec(redirectUrl);

      if (accessToken || error) {
        closedByUser = false;
        FB.setAccessToken(accessToken);
        FB.api(
          '/me',
          {
            fields: ['id', 'name', 'picture.width(800).height(800)'],
          },
          (res: any) => {
            authWindow.webContents.executeJavaScript(
              `document.getElementById("fb-name").innerHTML = " Name: ${res.name}"`
            );
            authWindow.webContents.executeJavaScript(
              `document.getElementById("fb-id").innerHTML = " ID: ${res.id}"`
            );
            authWindow.webContents.executeJavaScript(
              `document.getElementById("fb-pp").src = "${res.picture.data.url}"`
            );
          }
        );
        authWindow.close();
      }
    };

    authWindow.webContents.on('will-navigate', (event, url) => handleUrl(url));
    const filter = {
      urls: [`${options.redirect_uri}*`],
    };
    electron.remote.session.defaultSession.webRequest.onCompleted(
      filter,
      (details) => {
        handleUrl(details.url);
      }
    );

    authWindow.on('close', () => {
      if (closedByUser) {
        reject(new Error(''));
      } else {
        resolve({ accessToken });
      }
      // closedByUser ? reject('') : resolve({ accessToken });
    });
  });
};
