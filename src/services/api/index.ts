// const modules: { [key: string]: string } = {};
// const files = require.context('./modules', true, /\.ts$/);
// files.keys().forEach((path) => {
//   const filePath = path.replace('services/api/modules', '.');
//   const module = files(path).default;
//   const name = (/'\.\/(.*?)\./.exec(`"'${filePath}'"`) as string[])[1];
//   modules[name] = module;
// });
// export default modules;
// 以上做法够灵活, 但失去提示

import meeting from './modules/meeting';
import login from './modules/login';

export default {
  meeting,
  login,
};
