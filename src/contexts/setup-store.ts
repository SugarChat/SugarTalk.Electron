import { ThirdPartyFrom } from '../screens/login/type';

export type IActionType = 'UpdateIdToken' | 'UpdateUserInfo' | 'UpdateMeetings';

export interface IRootStoreAction {
  type: IActionType;
  payload: any;
}

export interface IRootStore {
  userStore: {
    idToken: string;
    userInfo: {
      id: string;
      name: string;
      avatar: string;
      email: string;
      thirdPartyFrom: ThirdPartyFrom;
      thirdPartyId: string;
    };
  };
  mettingStore: { historyMeetings: [] };
  dispatch: React.Dispatch<IRootStoreAction>;
}

export const BaseStoreInstance: IRootStore = {
  userStore: {
    idToken: '',
    userInfo: {
      id: '',
      name: '',
      avatar: '',
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
