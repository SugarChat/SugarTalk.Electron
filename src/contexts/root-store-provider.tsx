import React, { useReducer, FunctionComponent } from 'react';
import { clone } from 'ramda';
import { IRootStore, IRootStoreAction, BaseStoreInstance } from './setup-store';
import { RootStoreContextProvider } from './root-context';

export const RootStoreProvider: FunctionComponent = ({ children }) => {
  const [state, dispatch] = useReducer(
    (rootStore: IRootStore, action: IRootStoreAction) => {
      const newRootStore = clone(rootStore);
      switch (action.type) {
        case 'UpdateIdToken':
          newRootStore.userStore.idToken = action.payload;
          break;
        case 'UpdateUserInfo':
          newRootStore.userStore.userInfo = action.payload;
          break;
        case 'UpdateMeetings':
          newRootStore.mettingStore.historyMettings = action.payload;
          break;
        default:
          throw new Error();
      }
      return newRootStore;
    },
    BaseStoreInstance
  );

  return (
    <RootStoreContextProvider value={{ ...state, dispatch }}>
      {children}
    </RootStoreContextProvider>
  );
};
