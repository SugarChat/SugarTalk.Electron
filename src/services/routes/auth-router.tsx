import React, { FunctionComponent, useMemo } from 'react';
import { Route, useLocation, useHistory } from 'react-router-dom';
import { IRoute } from '../../screens/index';
import { Login } from '../../screens/login/index';
import { useStores } from '../../contexts/root-context';
import { MeetingList } from '../../screens/meeting-list';

export interface IAuthRouterProps {
  routers: IRoute[];
}

export const AuthRoute: FunctionComponent<IAuthRouterProps> = ({ routers }) => {
  const location = useLocation<IAuthRouterProps>();
  const { pathname } = location;
  const history = useHistory();
  const { userStore } = useStores();

  const isLogin = useMemo(() => {
    return Boolean(userStore.idToken);
  }, [userStore]);

  const authRoutes = useMemo(() => {
    return routers.map((route) => {
      // 能直接访问
      if (!route.auth) {
        return (
          <Route
            key={route.name}
            path={route.path}
            component={route.component}
            exact={route.exact}
          />
        );
      }

      return (
        <Route
          key={route.name}
          path={route.path}
          exact={route.exact}
          render={() => {
            if (isLogin) {
              return <route.component />;
            }
            return <Login />;
          }}
        />
      );
    });
  }, [routers, isLogin, pathname, history]);

  return <>{authRoutes}</>;
};
