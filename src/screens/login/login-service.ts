import http, { IncomingMessage } from 'http';
import Url from 'url';
import * as FB from 'fb-sdk-wrapper';
import * as electron from 'electron';
import Env from '../../config/env';
import Api from '../../services/api/modules/login';

export const googleAuthenticated = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const redirectUri = `http://localhost:${Env.redirectUriPort}`;

    const requestListener = async (request: IncomingMessage) => {
      try {
        if ((request.url as string).indexOf('code') > -1) {
          const qs = new Url.URL(request.url as string, redirectUri)
            .searchParams;
          const code = qs.get('code') as string;
          Api.googleSign(code)
            .then((res) => {
              resolve(res.data);
            })
            .catch((error) => reject(error));
        }
      } catch (e) {
        reject(e);
      }
    };

    const server = http
      .createServer(requestListener)
      .listen(Env.redirectUriPort);

    server.on('listening', () => {
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

      const scope = encodeURIComponent(
        'https://www.googleapis.com/auth/userinfo.email'
      );

      authWindow.loadURL(
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
          Env.googleClientId
        }&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&prompt=consent&include_granted_scopes=true`
      );

      authWindow.webContents.on('did-redirect-navigation', (_event, newUrl) => {
        if (newUrl.includes(redirectUri)) {
          setTimeout(() => {
            authWindow.close();
          }, 300);
        }
      });

      authWindow.on('close', () => {
        server?.close();
      });
    });

    server.on('error', (err: Error) => {
      server?.close();
      reject(err.message);
    });
  });
};

export const facebookAuthenticated = (): Promise<{ accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const redirectUri = `https://testshopping.yamimeal.com/index.html`;
    const options = {
      clientId: Env.facebookClientId,
      scopes: 'email',
      redirectUri,
    };

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
    const facebookAuthURL = `https://www.facebook.com/v3.6/dialog/oauth?client_id=${options.clientId}&redirect_uri=${options.redirectUri}&response_type=token&scope=${options.scopes}&display=popup`;
    authWindow.loadURL(facebookAuthURL);
    authWindow.webContents.openDevTools();
    // authWindow.webContents.on('did-finish-load', () => {
    //   authWindow.show();
    // });
    let accessToken = '';
    let error: RegExpExecArray | null = null;
    let closedByUser = true;

    const handleUrl = (redirectUrl: string) => {
      const rawCode = /access_token=([^&]*)/.exec(redirectUrl) || '';
      accessToken = rawCode && rawCode.length > 1 ? rawCode[1] : '';
      error = /\?error=(.+)$/.exec(redirectUrl);

      if (accessToken || error) {
        closedByUser = false;
        FB.api('/me', 'get', {
          fields: ['id', 'name', 'picture.width(800).height(800)'],
        })
          .then((res) => {
            console.log(res);
          })
          .catch(() => {});
        authWindow.close();
      }
    };

    authWindow.webContents.on('will-redirect', (_event, url) => {
      setTimeout(() => {
        console.log(url);
      }, 1000);

      handleUrl(url);
    });

    authWindow.on('close', () => {
      FB.logout();
      if (closedByUser) {
        reject(new Error(''));
      } else {
        resolve({ accessToken });
      }
      // closedByUser ? reject('') : resolve({ accessToken });
    });
  });
};
