export type IActionType = 'UpdateIdToken' | 'UpdateUserInfo' | 'UpdateMettings';

export interface IRootStoreAction {
  type: IActionType;
  payload: any;
}

export interface IRootStore {
  userStore: { idToken: string; userInfo: { name: string; avatar: string } };
  mettingStore: { historyMettings: [] };
  dispatch: React.Dispatch<IRootStoreAction>;
}

export const BaseStoreInstance: IRootStore = {
  userStore: { idToken: '', userInfo: { name: '', avatar: '' } },
  mettingStore: { historyMettings: [] },
  dispatch: (value) => {},
};

export const setupRootStore = () => {
  const storeString = localStorage.getItem('store');
  try {
    if (!storeString) {
      return BaseStoreInstance;
    }
    return JSON.parse(storeString);
  } catch (error) {
    return BaseStoreInstance;
  }
};
