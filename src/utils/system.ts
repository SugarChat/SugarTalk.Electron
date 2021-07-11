/**
 * 获取环境
 *
 * @returns
 */
export const getPlatform = (): 'win' | 'mac' | 'other' => {
  const processPlatform = process.platform;

  if (processPlatform === 'darwin') {
    return 'mac';
  }
  if (processPlatform.startsWith('win')) {
    return 'win';
  }
  return 'other';
};
