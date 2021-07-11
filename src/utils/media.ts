import electron from 'electron';
import { exec } from 'child_process';
import { getPlatform } from './system';

/**
 * 获取媒体设备状态
 *
 * @returns
 */
export const getMediaDeviceStatus = async (
  mediaType: 'microphone' | 'camera'
): Promise<boolean> => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  const mediaTypeKind =
    mediaType === 'microphone' ? 'audioinput' : 'videoinput';

  const filtered = devices.filter(
    (device) => device.kind === mediaTypeKind && device.label
  );

  return filtered.length > 0;
};

/**
 * 显示媒体权限请求对话框
 *
 * @param mediaType
 */
const showRequestMediaAccessDialog = (mediaType: 'microphone' | 'camera') => {
  const mediaTypeDescription = mediaType === 'microphone' ? '麦克风' : '摄像头';
  const mediaTypePreferencesName =
    mediaType === 'microphone' ? 'Privacy_Microphone' : 'Privacy_Camera';

  const dialogResult = electron.remote.dialog.showMessageBoxSync({
    detail: `请在系统偏好设置下的安全性与隐私中允许SugarTalk访问您的${mediaTypeDescription}`,
    message: `无法使用${mediaTypeDescription}`,
    type: 'warning',
    buttons: ['前往设置', '取消'],
    defaultId: 0,
    cancelId: 1,
  });

  if (dialogResult === 0) {
    exec(
      `open "x-apple.systempreferences:com.apple.preference.security?${mediaTypePreferencesName}"`
    );
  }
};

/**
 * 获取媒体权限状态
 *
 * @param mediaType
 * @param requestAccess
 * @returns
 */
export const getMediaAccessStatus = async (
  mediaType: 'microphone' | 'camera',
  requestAccess = false
): Promise<boolean> => {
  const platform = getPlatform();

  if (platform === 'win') {
    return (
      electron.remote.systemPreferences.getMediaAccessStatus(mediaType) ===
      'granted'
    );
  }

  if (platform === 'mac') {
    const accessResult =
      await electron.remote.systemPreferences.askForMediaAccess(mediaType);

    if (accessResult) {
      return true;
    }

    if (requestAccess) {
      showRequestMediaAccessDialog(mediaType);
    }

    return false;
  }

  return false;
};
