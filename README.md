## Install dependencies with yarn:

```bash
yarn
```

## Starting Development

Start the app in the dev environment:

```bash
yarn start
```

## Packaging

To package apps for the local platform:

```bash
yarn package
```

You can debug your production build with devtools by simply setting the DEBUG_PROD env variable:

```bash
yarn cross-env DEBUG_PROD=true yarn package
```

Remote debugging, browser open http://127.0.0.1:8315/

```bash
open /SugarTalk.Electron/release/mac/ElectronReact.app --args --remote-debugging-port=8315
```

# 代码规范

### 命名

```
文件统一: login-service.ts
方法名统一: getAuthenticatedClient
接口(枚举)统一: IRequest
组件统一: Login
```

### Http Modules 规范

```
scheduleMeeting: async (onError: (error: Error) => void) => {
    return await api
      .post<SugarTalkResponse<MeetingDto>>('/meeting/schedule', {})
      .catch((e) => onError(e));
  },
```
