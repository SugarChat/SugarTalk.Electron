import React, { useReducer } from 'react';
import { IRootStore, IRootStoreAction, BaseStoreInstance } from './setup-store';
import { RootStoreContextProvider } from './root-context';
import { Loading } from '../components/loading';

export interface IRootStoreProviderProps {
  rootStoreFromLocalStorage: IRootStore;
}

export const RootStoreProvider: React.FC<IRootStoreProviderProps> = ({
  rootStoreFromLocalStorage,
  children,
}) => {
  const [state, dispatch] = useReducer(
    (rootStore: IRootStore, action: IRootStoreAction) => {
      const newRootStore = { ...rootStore };
      switch (action.type) {
        case 'UpdateIdToken':
          newRootStore.userStore.idToken = action.payload;
          break;
        case 'UpdateUserInfo':
          newRootStore.userStore.userInfo = action.payload;
          break;
        case 'UpdateMeetings':
          newRootStore.mettingStore.historyMeetings = action.payload;
          break;
        default:
          throw new Error();
      }
      localStorage.setItem('rootStore', JSON.stringify(newRootStore));
      return newRootStore;
    },
    rootStoreFromLocalStorage ?? BaseStoreInstance
  );

  return (
    <RootStoreContextProvider value={{ ...state, dispatch }}>
      <Loading />
      {children}
    </RootStoreContextProvider>
  );
};
