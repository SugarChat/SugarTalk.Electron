import React, { useContext } from 'react';

export interface IUserProvider {
  idToken: string;
  user: { [key: string]: string };
}

const UserContext = React.createContext<IUserProvider>({
  idToken: '',
  user: { name: '1' },
});

export const UserContextProvider = UserContext.Provider;

export const useProviderValue = () => useContext(UserContext);
