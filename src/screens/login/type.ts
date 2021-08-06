export enum ThirdPartyFrom {
  google,
  wechat,
  facebook,
}

export interface IUserInfo {
  displayName: string;
  email: string;
  id: string;
  picture: string;
  thirdPartyFrom: ThirdPartyFrom;
  thirdPartyId: string;
}

export interface IGoogleAccessToken {
  accessToken: string;
  expiresIn: number;
  idToken: string;
  scope: string;
  tokenType: string;
}

export type LoginType = 'Google' | 'Facebook' | 'Wechat';

export interface ILoginProps {
  loginType: LoginType;
  onSuccess: () => void;
}

export interface ILoginPlatform extends ILoginProps {
  imageSrc: string;
}
