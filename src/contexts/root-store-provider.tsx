import React, { useReducer, FunctionComponent } from 'react';
import { clone } from 'ramda';
import { IRootStore, IRootStoreAction, BaseStoreInstance } from './setup-store';
import { RootStoreContextProvider } from './index';

export const RootStoreProvider: FunctionComponent = ({ children }) => {
  const [state, dispatch] = useReducer(
    (rootStore: IRootStore, action: IRootStoreAction) => {
      const newRootStore = clone(rootStore);
      switch (action.type) {
        case 'UpdateIdToken':
          newRootStore.userStore.idToken = action.payload;
          return { ...newRootStore };
        case 'UpdateUserInfo':
          newRootStore.userStore.userInfo = action.payload;
          return { ...newRootStore };
        case 'UpdateMettings':
          newRootStore.mettingStore.historyMettings = action.payload;
          return { ...newRootStore };
        default:
          throw new Error();
      }
    },
    BaseStoreInstance
  );

  return (
    <RootStoreContextProvider value={{ ...state, dispatch }}>
      {children}
    </RootStoreContextProvider>
  );
};
