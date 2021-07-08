## Install dependencies with yarn:

```bash
yarn
```

## Starting Development

Start the app in the dev environment:

```bash
yarn start
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
