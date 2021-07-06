import React, { useContext } from 'react';
import { IRootStore, BaseStoreInstance } from './setup-store';

const RootStoreContext = React.createContext<IRootStore>(BaseStoreInstance);

export const RootStoreContextProvider = RootStoreContext.Provider;

export const useStores = () => useContext(RootStoreContext);
