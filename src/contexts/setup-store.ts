import { ThirdPartyFrom, IUserInfo } from '../screens/login/type';

export type IActionType = 'UpdateIdToken' | 'UpdateUserInfo' | 'UpdateMeetings';

export interface IRootStoreAction {
  type: IActionType;
  payload: any;
}

export interface IRootStore {
  userStore: {
    idToken: string;
    userInfo: IUserInfo;
  };
  mettingStore: { historyMeetings: [] };
  dispatch: React.Dispatch<IRootStoreAction>;
}

export const BaseStoreInstance: IRootStore = {
  userStore: {
    idToken: '',
    userInfo: {
      id: '',
      displayName: '',
      picture: '',
      email: '',
      thirdPartyFrom: ThirdPartyFrom.google,
      thirdPartyId: '',
    },
  },
  mettingStore: { historyMeetings: [] },
  dispatch: (value) => {},
};

export const loadRootStore = (): IRootStore => {
  const storeString = localStorage.getItem('rootStore');
  try {
    if (!storeString) {
      return BaseStoreInstance;
    }
    return JSON.parse(storeString);
  } catch (error) {
    return BaseStoreInstance;
  }
};
