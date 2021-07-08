export type IActionType = 'UpdateIdToken' | 'UpdateUserInfo' | 'UpdateMeetings';

export interface IRootStoreAction {
  type: IActionType;
  payload: any;
}

export interface IRootStore {
  userStore: { idToken: string; userInfo: { name: string; avatar: string } };
  mettingStore: { historyMeetings: [] };
  dispatch: React.Dispatch<IRootStoreAction>;
}

export const BaseStoreInstance: IRootStore = {
  userStore: { idToken: '', userInfo: { name: '', avatar: '' } },
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
