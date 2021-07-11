import Url from 'url';
import * as FB from 'fb-sdk-wrapper';
import * as electron from 'electron';
import Env from '../../config/env';
import Api from '../../services/api/modules/login';

const getBrowserWindowInstance = () => {
  return new electron.remote.BrowserWindow({
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
};

export const googleAuthenticated = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const authWindow = getBrowserWindowInstance();

    authWindow.webContents.userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0';

    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/userinfo.email'
    );

    const redirectUri = 'https://testmerchant.yamimeal.com';

    authWindow.loadURL(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        Env.googleClientId
      }&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(
        'https://testmerchant.yamimeal.com'
      )}&prompt=consent&include_granted_scopes=true`
    );

    authWindow.webContents.on('did-redirect-navigation', (_event, newUrl) => {
      if (newUrl.includes(redirectUri)) {
        getGoogleCode(newUrl);
      }
    });

    const getGoogleCode = async (url: string) => {
      try {
        if (url.indexOf('code') > -1) {
          const qs = new Url.URL(url, redirectUri).searchParams;
          const code = qs.get('code') as string;
          Api.googleSign(code)
            .then((res) => {
              resolve(res.data);
            })
            .catch((error) => reject(error));
        }
      } catch (e) {
        reject(e);
      } finally {
        authWindow?.close();
        window?.loadingClose();
      }
    };
    authWindow.on('close', () => {
      window?.loadingClose();
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

    const authWindow = getBrowserWindowInstance();

    const facebookAuthURL = `https://www.facebook.com/v3.6/dialog/oauth?client_id=${options.clientId}&redirect_uri=${options.redirectUri}&response_type=token&scope=${options.scopes}&display=popup`;
    authWindow.loadURL(facebookAuthURL);
    authWindow.webContents.openDevTools();

    authWindow.webContents.on('did-finish-load', () => {
      authWindow.show();
    });

    authWindow.webContents.on('will-redirect', (_event, url) => {
      handleUrl(url);
    });

    const handleUrl = (url: string) => {
      try {
        const rawCode = /access_token=([^&]*)/.exec(url) || '';
        const accessToken = rawCode && rawCode.length > 1 ? rawCode[1] : '';
        const urlParseError = /\?error=(.+)$/.exec(url);
        if (!accessToken || urlParseError) {
          return reject(new Error('login fail'));
        }
        Api.facebookSign(accessToken)
          .then((res) => {
            if (res.code === 2000) {
              return resolve(res.data);
            }
            return reject(new Error('login fail'));
          })
          .catch((error: Error) => reject(error));
      } catch (error) {
        reject(error);
      } finally {
        authWindow?.close();
      }
    };

    authWindow.on('close', () => {
      window?.loadingClose();
      // FB.logout();
    });
  });
};
