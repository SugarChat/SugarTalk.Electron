import { IRoute } from '../../screens/index';

const whitelist = ['login'];

const modules: IRoute[] = [];
const files = require.context('../../screens/', true, /\.tsx$/);

files.keys().forEach((path) => {
  const filePath = path
    .replace('screens', '')
    .replace('/index.tsx', '')
    .replace('.', '');
  const module = files(path).default;
  if (modules.findIndex((x) => x.path === filePath) === -1) {
    modules.push({
      path: filePath,
      name: module.name,
      component: module,
      auth: false,
      exact: false,
    });
  }
});
/**
 * 会动态把screens下面的加入路由, 但这种写法开过过程导致不能刷新放弃
 */
export default modules;
