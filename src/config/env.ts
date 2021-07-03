import { Env as IEnv } from './env.type';

const config = require('./config.json');

const Env: IEnv = config as IEnv;

export default Env;
